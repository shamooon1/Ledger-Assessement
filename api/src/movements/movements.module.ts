import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MovementsController } from './movements.controller.js';
import { MovementsService } from './movements.service.js';
import { Movement, MovementSchema } from './schemas/movement.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Movement.name, schema: MovementSchema }])
  ],
  controllers: [MovementsController],
  providers: [MovementsService]
})
export class MovementsModule {}
