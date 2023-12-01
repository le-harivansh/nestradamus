/**
 * This module is **ONLY** used when seeding the database. It was created so
 * that the entire application is not bootstrapped just to seed the database.
 *
 * Otherwise, other external dependencies would need to be started just to run
 * this script.
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ConfigurationModule } from '@/_application/_configuration/configuration.module';
import { DatabaseModule } from '@/_application/_database/database.module';
import applicationConfiguration from '@/_application/application.config';

import { SeederModule } from './_seeder/seeder.module';

@Module({
  imports: [
    ConfigurationModule,
    ConfigModule.forFeature(applicationConfiguration),
    DatabaseModule,
    SeederModule,
  ],
})
export class ApplicationModule {}
