import { Controller, Get, Inject } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { Db } from 'mongodb';

import { DATABASE } from '@library/database';

import { HEALTHCHECK_ROUTE } from '../constant';
import { MongoDbHealthIndicator } from '../health-indicator/mongo-db.health-indicator';

@Controller(HEALTHCHECK_ROUTE)
export class HealthCheckController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly mongoDbHealthIndicator: MongoDbHealthIndicator,
    @Inject(DATABASE) private readonly database: Db,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.healthCheckService.check([
      () => this.mongoDbHealthIndicator.canConnectToDatabase(this.database),

      // @see: https://docs.nestjs.com/recipes/terminus
    ]);
  }
}
