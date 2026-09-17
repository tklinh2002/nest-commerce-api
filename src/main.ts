import 'temporal-polyfill/full/global';
import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { Logger } from 'nestjs-pino';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    instrument: ObserveInstrument,
  });

  app.useLogger(app.get(Logger));

  // 1. Enable Swagger UI Documentation
  // This is a UI for testing our API endpoints
  const config = new DocumentBuilder()
    .setTitle('E-Commerce API') // Your API Title
    .setDescription('API documentation for E-Commerce Application') // API Description
    .setVersion('1.0') // API Version
    .addBearerAuth() // Tells Swagger to look for Bearer Tokens (JWT)
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document); // Access docs at http://localhost:3000/docs

  // 2. Serve Static Assets (Frontend Files)
  // This allows you to run the backend alone and access the frontend via http://localhost:3000/docs
  app.useStaticAssets(join(process.cwd(), 'public'));

  // 3. Enable Helmet (Auto-adds security HTTP headers to prevent XSS, Clickjacking, etc.)
  app.use(helmet());

   // 4. Enable CORS (Only allow Frontend at localhost:3001 to call our API)
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true,
  });

    // 5. Enable global ValidationPipe (Auto-validates incoming requests based on DTOs)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips away any unexpected fields not defined in the DTO
      forbidNonWhitelisted: true, // Throws an error if unexpected fields are present
      transform: true, // Auto-transforms payloads to be objects typed according to their DTO classes
    }),
  );

    // Apply Interceptor & Filter globally
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
