import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule as DatabaseLibraryModule } from '@library/database';

import { ConfigurationService } from '../_configuration/service/configuration.service';
import databaseConfiguration from './database.config';

@Module({
  imports: [
    ConfigModule.forFeature(databaseConfiguration),

    DatabaseLibraryModule.forRootAsync({
      inject: [ConfigurationService],
      useFactory: (configurationService: ConfigurationService) => ({
        scheme: configurationService.getOrThrow('database.scheme'),
        host: configurationService.getOrThrow('database.host'),
        port: configurationService.getOrThrow('database.port'),
        username: configurationService.getOrThrow('database.username'),
        password: configurationService.getOrThrow('database.password'),
        databaseName: configurationService.getOrThrow('database.name'),

        applicationName: configurationService.getOrThrow('application.name'),
      }),

      // Extra options.
      isGlobal: true,
    }),
  ],
})
export class DatabaseModule {}
