import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { Db } from 'mongodb';

@Injectable()
export class MongoDbHealthIndicator extends HealthIndicator {
  private static readonly KEY = 'database';

  async canConnectToDatabase(database: Db): Promise<HealthIndicatorResult> {
    const ping = await database.command({ ping: true });

    if (!ping['ok']) {
      throw new HealthCheckError(
        'Could not ping the database',
        this.getStatus(MongoDbHealthIndicator.KEY, false, {
          message: 'Could not ping the database.',
        }),
      );
    }

    return this.getStatus(MongoDbHealthIndicator.KEY, true);
  }
}
