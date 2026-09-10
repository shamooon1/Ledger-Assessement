import { Controller, Get } from '@nestjs/common';

@Controller('workers')
export class WorkersController {
  @Get()
  getWorkers() {
    // TODO: implement
    return [];
  }
}
