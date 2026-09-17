import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { TerminusModule } from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health.js';
import { DatabaseHealthIndicator } from './database.health.js';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [DatabaseHealthIndicator, RedisHealthIndicator]
})
export class HealthModule { }
