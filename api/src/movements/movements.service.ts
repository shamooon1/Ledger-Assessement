import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, type Connection, type ClientSession } from 'mongoose';
import { Movement, MovementDocument } from './schemas/movement.schema.js';

@Injectable()
export class MovementsService {
  constructor(
    @InjectModel(Movement.name) private movementModel: Model<MovementDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  async correctMovement(id: string, correctedFields: Partial<Movement>, reason: string) {
    const original = await this.movementModel.findById(id).exec();
    if (!original) {
      throw new NotFoundException('Movement not found');
    }

    if (original.correctedBy) {
      throw new ConflictException('This movement has already been corrected');
    }

    return this.withTransaction(async (session) => {
      const newMovementData = {
        ...original.toObject(),
        ...correctedFields,
        _id: undefined,
        __v: undefined,
        type: 'correction',
        correctionOf: original._id,
        correctedBy: null,
        recordedAt: new Date(),
        reason,
        idempotencyKey: `${original.idempotencyKey}-correction`,
      };

      const newMovement = new this.movementModel(newMovementData);
      await newMovement.save({ session });

      await this.movementModel.updateOne(
        { _id: original._id },
        { $set: { correctedBy: newMovement._id } },
        { session }
      ).exec();

      // Note: corrections only fix the historical record, they do not re-trigger side effects on Asset.heldBy.
      // This is an explicitly known scope limitation.

      return newMovement;
    });
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
