import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthCheckController } from './controller/health-check.controller';
import { MongoDbHealthIndicator } from './health-indicator/mongo-db.health-indicator';

@Module({
  imports: [TerminusModule],
  controllers: [HealthCheckController],
  providers: [MongoDbHealthIndicator],
})
export class HealthCheckModule {}
