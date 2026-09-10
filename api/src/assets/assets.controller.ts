import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { AssetsService } from './assets.service.js';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  getAssets() {
    // TODO: implement
    return [];
  }

  @Post(':id/out-of-service')
  markOutOfService(
    @Param('id') id: string,
    @Body() body: { reason: string; idempotencyKey: string }
  ) {
    return this.assetsService.markOutOfService(id, body.reason, body.idempotencyKey);
  }

  @Post(':id/in-service')
  markInService(
    @Param('id') id: string,
    @Body() body: { idempotencyKey: string }
  ) {
    return this.assetsService.markInService(id, body.idempotencyKey);
  }
}
