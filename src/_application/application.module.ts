import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { ConfigurationModule } from './_configuration/configuration.module';
import { ConfigurationService } from './_configuration/service/configuration.service';
import { DatabaseModule } from './_database/database.module';
import { HealthModule } from './_health/health.module';
import { LoggerModule } from './_logger/logger.module';
import { MailModule } from './_mail/mail.module';
import { QueueModule } from './_queue/queue.module';
import applicationConfiguration from './application.config';

@Module({
  imports: [
    ConfigurationModule,

    ConfigModule.forFeature(applicationConfiguration),

    LoggerModule,

    DatabaseModule,

    ThrottlerModule.forRootAsync({
      inject: [ConfigurationService],
      useFactory: (configurationService: ConfigurationService) => [
        {
          name: 'default',
          ttl: configurationService.getOrThrow('application.rateLimiter.ttl'),
          limit: configurationService.getOrThrow(
            'application.rateLimiter.limit',
          ),
          skipIf: () =>
            configurationService.getOrThrow('application.environment') ===
            'test',
        },
      ],
    }),

    EventEmitterModule.forRoot(),

    QueueModule,

    MailModule,

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
