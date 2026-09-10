import { Controller, Get } from '@nestjs/common';

@Controller('assets')
export class AssetsController {
  @Get()
  getAssets() {
    // TODO: implement
    return [];
  }
}
