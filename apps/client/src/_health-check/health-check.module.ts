import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthCheckController } from './controller/health-check.controller';
import { DatabaseHealthIndicator } from './health-indicator/database.health-indicator';

@Module({
  imports: [TerminusModule],
  controllers: [HealthCheckController],
  providers: [DatabaseHealthIndicator],
})
export class HealthCheckModule {}
