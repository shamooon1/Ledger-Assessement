import { Controller, Get } from '@nestjs/common';

@Controller('movements')
export class MovementsController {
  @Get()
  getMovements() {
    // TODO: implement
    return [];
  }
}
