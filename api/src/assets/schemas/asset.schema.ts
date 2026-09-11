import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Worker } from '../../workers/schemas/worker.schema.js';

export type AssetDocument = Asset & Document;

@Schema()
export class Asset {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  kind: string;

  @Prop({ type: String, default: null })
  requiresCertification: string | null;

  @Prop({ required: true, enum: ['in_service', 'out_of_service'], default: 'in_service' })
  serviceStatus: string;

  @Prop({ type: Types.ObjectId, ref: 'Worker', default: null })
  heldBy: Worker | Types.ObjectId | null;

  @Prop({ type: Number, default: 0 })
  reservationTouch: number;
}

export const AssetSchema = SchemaFactory.createForClass(Asset);
