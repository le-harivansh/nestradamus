import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ConfigurationModule } from '../src/_configuration/configuration.module';
import { DatabaseModule as ClientDatabaseModule } from '../src/_database/database.module';
import applicationConfiguration from '../src/application.config';
import { DatabaseModule as CliDatabaseModule } from './_database/database.module';

@Module({
  imports: [
    ConfigurationModule,
    ConfigModule.forFeature(applicationConfiguration),

    ClientDatabaseModule,
    CliDatabaseModule,
  ],
})
export class CliModule {}
