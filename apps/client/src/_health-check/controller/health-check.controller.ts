import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@Controller('healthcheck')
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
