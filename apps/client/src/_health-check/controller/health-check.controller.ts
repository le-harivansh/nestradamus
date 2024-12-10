import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

import { HEALTHCHECK_ROUTE } from '../constant';
import { DatabaseHealthIndicator } from '../health-indicator/database.health-indicator';

@Controller(HEALTHCHECK_ROUTE)
export class HealthCheckController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly mongoDbHealthIndicator: DatabaseHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.healthCheckService.check([
      () => this.mongoDbHealthIndicator.pingDatabase(),

      // @see: https://docs.nestjs.com/recipes/terminus
    ]);
  }
}
