import 'temporal-polyfill/full/global';
import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  // 1. Enable Helmet (Auto-adds security HTTP headers to prevent XSS, Clickjacking, etc.)
  app.use(helmet());

   // 2. Enable CORS (Only allow Frontend at localhost:3001 to call our API)
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true,
  });

    // 3. Enable global ValidationPipe (Auto-validates incoming requests based on DTOs)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips away any unexpected fields not defined in the DTO
      forbidNonWhitelisted: true, // Throws an error if unexpected fields are present
      transform: true, // Auto-transforms payloads to be objects typed according to their DTO classes
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
