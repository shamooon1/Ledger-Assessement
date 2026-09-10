import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WorkerDocument = Worker & Document;

@Schema()
export class Worker {
  @Prop({ required: true })
  name: string;

  @Prop({ type: [{ kind: String, expiresAt: Date }], default: [] })
  certifications: { kind: string; expiresAt: Date }[];
}

export const WorkerSchema = SchemaFactory.createForClass(Worker);
