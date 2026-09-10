import { Controller, Post, Param, Body } from '@nestjs/common';
import { MovementsService } from './movements.service.js';

@Controller('movements')
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Post(':id/correct')
  correctMovement(
    @Param('id') id: string,
    @Body() body: { correctedFields: any; reason: string }
  ) {
    return this.movementsService.correctMovement(id, body.correctedFields, body.reason);
  }
}
