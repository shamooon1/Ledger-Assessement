import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AssetsModule } from './assets/assets.module.js';
import { WorkersModule } from './workers/workers.module.js';
import { MovementsModule } from './movements/movements.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { SeedModule } from './seed/seed.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGO_URI || 'mongodb://localhost:27017/equipment-ledger?replicaSet=rs0',
      }),
    }),
    AssetsModule,
    WorkersModule,
    MovementsModule,
    ReservationsModule,
    SeedModule,
  ],
})
export class AppModule {}
