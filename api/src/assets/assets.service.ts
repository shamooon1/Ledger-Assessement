import { Injectable, ConflictException, InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, ClientSession } from 'mongoose';
import { Asset, AssetDocument } from './schemas/asset.schema.js';
import { Movement, MovementDocument } from '../movements/schemas/movement.schema.js';
import { Worker, WorkerDocument } from '../workers/schemas/worker.schema.js';
import { Reservation, ReservationDocument } from '../reservations/schemas/reservation.schema.js';

@Injectable()
export class AssetsService {
  constructor(
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,
    @InjectModel(Movement.name) private movementModel: Model<MovementDocument>,
    @InjectModel(Worker.name) private workerModel: Model<WorkerDocument>,
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  async issueAsset(assetId: string, workerId: string, occurredAt: Date, idempotencyKey: string) {
    const existingMovement = await this.movementModel.findOne({ idempotencyKey }).exec();
    if (existingMovement) {
      return existingMovement;
    }

    const assetToIssue = await this.assetModel.findById(assetId).exec();
    if (assetToIssue && assetToIssue.requiresCertification) {
      const worker = await this.workerModel.findById(workerId).exec();
      if (!worker) {
        throw new UnprocessableEntityException(`Worker not found`);
      }
      
      const cert = worker.certifications.find(c => c.kind === assetToIssue.requiresCertification);
      if (!cert || cert.expiresAt < occurredAt) {
        throw new UnprocessableEntityException(`${worker.name}'s ${assetToIssue.requiresCertification} certification is missing or expired`);
      }
    }

    return this.withTransaction(async (session) => {
      const asset = await this.assetModel.findOneAndUpdate(
        { _id: assetId, heldBy: null, serviceStatus: 'in_service' },
        { $set: { heldBy: workerId } },
        { new: true, session }
      ).exec();

      if (!asset) {
        throw new ConflictException("Asset is already held or unavailable");
      }

      const movement = new this.movementModel({
        assetId,
        workerId,
        type: 'issue',
        occurredAt,
        recordedAt: new Date(),
        idempotencyKey,
      });
      await movement.save({ session });

      return movement;
    });
  }

  async returnAsset(assetId: string, workerId: string, occurredAt: Date, idempotencyKey: string) {
    const existingMovement = await this.movementModel.findOne({ idempotencyKey }).exec();
    if (existingMovement) {
      return existingMovement;
    }

    return this.withTransaction(async (session) => {
      const asset = await this.assetModel.findOneAndUpdate(
        { _id: assetId, heldBy: workerId },
        { $set: { heldBy: null } },
        { new: true, session }
      ).exec();

      if (!asset) {
        throw new ConflictException("Asset is already held or unavailable");
      }

      const movement = new this.movementModel({
        assetId,
        workerId,
        type: 'return',
        occurredAt,
        recordedAt: new Date(),
        idempotencyKey,
      });
      await movement.save({ session });

      return movement;
    });
  }

  async markOutOfService(assetId: string, reason: string, idempotencyKey: string) {
    const existingMovement = await this.movementModel.findOne({ idempotencyKey }).exec();
    if (existingMovement) {
      return existingMovement;
    }

    return this.withTransaction(async (session) => {
      await this.assetModel.updateOne(
        { _id: assetId },
        { $set: { serviceStatus: 'out_of_service' } },
        { session }
      ).exec();

      const movement = new this.movementModel({
        assetId,
        workerId: null,
        type: 'out_of_service',
        occurredAt: new Date(),
        recordedAt: new Date(),
        idempotencyKey,
        reason,
      });
      await movement.save({ session });

      await this.reservationModel.updateMany(
        { assetId, status: 'active', startAt: { $gt: new Date() } },
        { $set: { status: 'cancelled', reason: 'asset marked out of service' } },
        { session }
      ).exec();

      return movement;
    });
  }

  async markInService(assetId: string, idempotencyKey: string) {
    const existingMovement = await this.movementModel.findOne({ idempotencyKey }).exec();
    if (existingMovement) {
      return existingMovement;
    }

    const updateResult = await this.assetModel.updateOne(
      { _id: assetId, serviceStatus: 'out_of_service' },
      { $set: { serviceStatus: 'in_service' } }
    ).exec();

    if (updateResult.matchedCount === 0) {
      throw new ConflictException("Asset is not currently out of service");
    }

    const movement = new this.movementModel({
      assetId,
      workerId: null,
      type: 'in_service',
      occurredAt: new Date(),
      recordedAt: new Date(),
      idempotencyKey,
    });
    await movement.save();

    return movement;
  }

  private async withTransaction<T>(fn: (session: ClientSession) => Promise<T>): Promise<T> {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const session = await this.connection.startSession();
      session.startTransaction();
      try {
        const result = await fn(session);
        await session.commitTransaction();
        return result;
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
