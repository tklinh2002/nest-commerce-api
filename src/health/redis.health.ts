import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import Redis from 'ioredis'; 

@Injectable()
export class RedisHealthIndicator {
  // Open a dedicated Redis connection for health checks
  private readonly redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  });

  constructor(private readonly healthIndicatorService: HealthIndicatorService) {}

  async isHealthy() {
    return this.healthIndicatorService
      .check('redis')
      .attempt(async () => {
        // Send a ping command; Redis responds with 'PONG' if healthy
        await this.redis.ping(); 
      });
  }
}
