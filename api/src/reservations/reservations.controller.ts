import { Controller, Get } from '@nestjs/common';

@Controller('reservations')
export class ReservationsController {
  @Get()
  getReservations() {
    // TODO: implement
    return [];
  }
}
