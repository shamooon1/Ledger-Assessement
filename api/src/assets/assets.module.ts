import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AssetsController } from './assets.controller.js';
import { AssetsService } from './assets.service.js';
import { Asset, AssetSchema } from './schemas/asset.schema.js';
import { Movement, MovementSchema } from '../movements/schemas/movement.schema.js';
import { Worker, WorkerSchema } from '../workers/schemas/worker.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Asset.name, schema: AssetSchema },
      { name: Movement.name, schema: MovementSchema },
      { name: Worker.name, schema: WorkerSchema }
    ])
  ],
  controllers: [AssetsController],
  providers: [AssetsService]
})
export class AssetsModule {}
