import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ConfigurationService } from '../_configuration/service/configuration.service';
import queueConfiguration from './queue.config';

@Module({
  imports: [
    ConfigModule.forFeature(queueConfiguration),
    BullModule.forRootAsync({
      inject: [ConfigurationService],
      useFactory: (configurationService: ConfigurationService) => ({
        prefix: configurationService.getOrThrow('queue.prefix'),
        redis: {
          host: configurationService.getOrThrow('queue.redis.host'),
          port: configurationService.getOrThrow('queue.redis.port'),
        },
      }),
    }),
  ],
})
export class QueueModule {}
