import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedService } from './seed.service.js';
import { Asset, AssetSchema } from '../assets/schemas/asset.schema.js';
import { Worker, WorkerSchema } from '../workers/schemas/worker.schema.js';
import { Movement, MovementSchema } from '../movements/schemas/movement.schema.js';
import { Reservation, ReservationSchema } from '../reservations/schemas/reservation.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Asset.name, schema: AssetSchema },
      { name: Worker.name, schema: WorkerSchema },
      { name: Movement.name, schema: MovementSchema },
      { name: Reservation.name, schema: ReservationSchema },
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
