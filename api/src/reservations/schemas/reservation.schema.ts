import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Asset } from '../../assets/schemas/asset.schema';
import { Worker } from '../../workers/schemas/worker.schema';

export type ReservationDocument = Reservation & Document;

@Schema()
export class Reservation {
  @Prop({ type: Types.ObjectId, ref: 'Asset', required: true })
  assetId: Asset | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Worker', required: true })
  workerId: Worker | Types.ObjectId;

  @Prop({ required: true })
  startAt: Date;

  @Prop({ required: true })
  endAt: Date;

  @Prop({ required: true, enum: ['active', 'cancelled', 'fulfilled'], default: 'active' })
  status: string;

  @Prop({ type: String, default: null })
  reason: string | null;

  @Prop({ type: String, required: true, unique: true })
  idempotencyKey: string;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);
ReservationSchema.index({ assetId: 1, startAt: 1, endAt: 1 });
