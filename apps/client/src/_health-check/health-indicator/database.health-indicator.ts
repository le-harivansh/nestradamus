import { Inject, Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { Db } from 'mongodb';

import { DATABASE } from '@library/database';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  private static readonly KEY = 'database';

  constructor(@Inject(DATABASE) private readonly database: Db) {
    super();
  }

  async pingDatabase(): Promise<HealthIndicatorResult> {
    const ping = await this.database.command({ ping: true });

    if (!ping['ok']) {
      throw new HealthCheckError(
        'Could not ping the database.',
        this.getStatus(DatabaseHealthIndicator.KEY, false, {
          message: 'Could not ping the database.',
        }),
      );
    }

    return this.getStatus(DatabaseHealthIndicator.KEY, true);
  }
}
