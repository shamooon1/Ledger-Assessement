import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { AssetsService } from './assets.service.js';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  getAssets() {
    return this.assetsService.getAssets();
  }

  @Post(':id/issue')
  issueAsset(
    @Param('id') id: string,
    @Body() body: { workerId: string; occurredAt: string; idempotencyKey: string }
  ) {
    return this.assetsService.issueAsset(id, body.workerId, new Date(body.occurredAt), body.idempotencyKey);
  }

  @Post(':id/return')
  returnAsset(
    @Param('id') id: string,
    @Body() body: { workerId: string; occurredAt: string; idempotencyKey: string }
  ) {
    return this.assetsService.returnAsset(id, body.workerId, new Date(body.occurredAt), body.idempotencyKey);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.assetsService.getHistory(id);
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
