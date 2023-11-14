import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import ms from 'ms';

import { ConfigurationModule } from './_configuration/configuration.module';
import { ConfigurationService } from './_configuration/service/configuration.service';
import { DatabaseModule } from './_database/database.module';
import { HealthModule } from './_health/health.module';
import { LoggerModule } from './_logger/logger.module';
import applicationConfiguration from './application.config';

@Module({
  imports: [
    ConfigurationModule,

    ConfigModule.forFeature(applicationConfiguration),

    LoggerModule,

    DatabaseModule.forRoot(),

    ThrottlerModule.forRootAsync({
      inject: [ConfigurationService],
      useFactory: (configurationService: ConfigurationService) => [
        {
          ttl: ms(
            configurationService.getOrThrow('application.rate-limiter.ttl'),
          ),
          limit: configurationService.getOrThrow(
            'application.rate-limiter.limit',
          ),
        },
      ],
    }),

    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class ApplicationModule {}
