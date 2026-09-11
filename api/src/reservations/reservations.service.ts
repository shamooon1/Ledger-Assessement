import { Injectable, BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, type Connection, type ClientSession } from 'mongoose';
import { Reservation, ReservationDocument } from './schemas/reservation.schema.js';
import { Asset, AssetDocument } from '../assets/schemas/asset.schema.js';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  async getReservations(assetId?: string) {
    const query: any = {};
    if (assetId) {
      query.assetId = Types.ObjectId.isValid(assetId)
        ? { $or: [{ assetId: new Types.ObjectId(assetId) }, { assetId }] }
        : assetId;
    } else {
      query.status = 'active'; // when fetching all, just get active ones
    }
    return this.reservationModel.find(query).sort({ startAt: 1 }).exec();
  }

  async createReservation(assetId: string, workerId: string, startAt: Date, endAt: Date, idempotencyKey: string) {
    if (endAt <= startAt) {
      throw new BadRequestException("endAt must be after startAt");
    }

    const existingReservation = await this.reservationModel.findOne({ idempotencyKey }).exec();
    if (existingReservation) {
      return existingReservation;
    }

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const session = await this.connection.startSession();
      session.startTransaction();
      try {
        // This update exists ONLY to force MongoDB to serialize two concurrent transactions
        // touching the same asset — it has no other purpose.
        const updateResult = await this.assetModel.updateOne(
          { _id: assetId, serviceStatus: 'in_service' },
          { $inc: { reservationTouch: 1 } },
          { session }
        ).exec();

        if (updateResult.matchedCount === 0) {
          throw new ConflictException("Asset not found or out of service");
        }

        const overlap = await this.reservationModel.findOne(
          {
            assetId,
            status: 'active',
            startAt: { $lt: endAt },
            endAt: { $gt: startAt },
          },
          null,
          { session }
        ).exec();

        if (overlap) {
          throw new ConflictException("Reservation window overlaps an existing one");
        }

        const createdReservations = await this.reservationModel.create(
          [
            {
              assetId,
              workerId,
              startAt,
              endAt,
              status: 'active',
              idempotencyKey,
            },
          ],
          { session }
        );

        await session.commitTransaction();
        return createdReservations[0];
      } catch (error: any) {
        await session.abortTransaction();
        if (error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError') && attempt < maxRetries) {
          continue;
        }
        throw error;
      } finally {
        await session.endSession();
      }
    }
    throw new InternalServerErrorException('Transaction failed after retries');
  }
}
