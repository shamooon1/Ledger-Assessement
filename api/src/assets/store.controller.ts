import { Controller, Get, Query } from '@nestjs/common';
import { AssetsService } from './assets.service.js';

@Controller('store')
export class StoreController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get('as-of')
  getStoreAsOf(
    @Query('instant') instantStr: string,
    @Query('assetId') assetId?: string
  ) {
    const instant = instantStr ? new Date(instantStr) : new Date();
    return this.assetsService.getStoreAsOf(instant, assetId);
  }
}
