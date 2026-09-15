import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // ConfigModule: load environment variables from .env file
    ConfigModule.forRoot({
      isGlobal: true, // allow to call ConfigService anywhere
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        DATABASE_URL: Joi.string().required(),
      }),
    }),
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'nest-commerce-api',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
