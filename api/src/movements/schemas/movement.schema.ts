import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MovementDocument = Movement & Document;

@Schema()
export class Movement {
  @Prop({ type: Types.ObjectId, ref: 'Asset', required: true })
  assetId: Types.ObjectId | string;

  @Prop({ type: Types.ObjectId, ref: 'Worker', default: null })
  workerId: Types.ObjectId | string | null;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  occurredAt: Date;

  @Prop({ required: true })
  recordedAt: Date;

  @Prop({ required: true, unique: true })
  idempotencyKey: string;

  @Prop({ type: String, default: null })
  reason: string | null;
}

export const MovementSchema = SchemaFactory.createForClass(Movement);
