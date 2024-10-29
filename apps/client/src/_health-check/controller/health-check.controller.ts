import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

import { HEALTHCHECK_ROUTE } from '../constant';

@Controller(HEALTHCHECK_ROUTE)
export class HealthCheckController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  @Get()
  @HealthCheck()
  check() {
    return this.healthCheckService.check([
      // @todo: Setup health-check indicators.
      // @see: https://docs.nestjs.com/recipes/terminus
    ]);
  }
}
