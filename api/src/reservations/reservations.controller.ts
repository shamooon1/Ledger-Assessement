import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ReservationsService } from './reservations.service.js';

@Controller()
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) { }

  @Get('reservations')
  getReservations(@Query('assetId') assetId?: string) {
    return this.reservationsService.getReservations(assetId);
  }

  @Post('assets/:id/reserve')
  createReservation(
    @Param('id') assetId: string,
    @Body() body: { workerId: string; startAt: string; endAt: string; idempotencyKey: string }
  ) {
    return this.reservationsService.createReservation(
      assetId,
      body.workerId,
      new Date(body.startAt),
      new Date(body.endAt),
      body.idempotencyKey
    );
  }
}
