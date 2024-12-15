import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  seconds,
  ThrottlerGuard,
  ThrottlerModule,
  ThrottlerOptions,
} from '@nestjs/throttler';

import { ConfigurationModule } from '../_configuration/configuration.module';
import { ConfigurationService } from '../_configuration/service/configuration.service';
import throttlingConfiguration from './throttling.config';

@Module({
  imports: [
    ConfigModule.forFeature(throttlingConfiguration),

    ThrottlerModule.forRootAsync({
      imports: [ConfigurationModule],
      inject: [ConfigurationService],
      useFactory: (configurationService: ConfigurationService) => {
        const throttlerOptions: ThrottlerOptions[] = [];

        if (
          configurationService.getOrThrow('application.environment') ===
          'production'
        ) {
          throttlerOptions.push({
            name: 'default',
            ttl: seconds(
              configurationService.getOrThrow('throttling.default.ttlSeconds'),
            ),
            limit: configurationService.getOrThrow('throttling.default.limit'),
          });
        }

        return throttlerOptions;
      },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class ThrottlingModule {}
