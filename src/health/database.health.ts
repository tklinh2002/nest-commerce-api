import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { db } from '../prisma/db.js';

@Injectable()
export class DatabaseHealthIndicator {
  constructor(private readonly healthIndicatorService: HealthIndicatorService) {}

  async isHealthy() {
    return this.healthIndicatorService
      .check('database')
      .attempt(async () => {
        // Execute a lightweight query to verify the database connection is alive
        await db.orm.public.User.where({}).first();
      });
  }
}
