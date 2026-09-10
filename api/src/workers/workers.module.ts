import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkersController } from './workers.controller.js';
import { WorkersService } from './workers.service.js';
import { Worker, WorkerSchema } from './schemas/worker.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Worker.name, schema: WorkerSchema }])
  ],
  controllers: [WorkersController],
  providers: [WorkersService],
  exports: [WorkersService]
})
export class WorkersModule {}
