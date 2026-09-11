import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { SeedService } from './seed.service.js';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(SeedService);
  await seedService.run();
  await app.close();
}
bootstrap();
