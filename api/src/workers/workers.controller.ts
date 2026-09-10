import { Controller, Get } from '@nestjs/common';
import { WorkersService } from './workers.service.js';

@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get()
  getWorkers() {
    return this.workersService.getWorkers();
  }
}
