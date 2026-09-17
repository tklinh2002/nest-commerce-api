import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './database.health.js';
import { RedisHealthIndicator } from './redis.health.js';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private dbHealth: DatabaseHealthIndicator,
    private redisHealth: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck() // Decorator marking this endpoint for health checks
  check() {
    // Run both Database and Redis checks simultaneously
    return this.health.check([
      () => this.dbHealth.isHealthy(),
      () => this.redisHealth.isHealthy(),
    ]);
  }
}
