import { Module } from '@nestjs/common';

import { ConfigurationModule } from '../src/_configuration/configuration.module';
import { DatabaseModule } from './_database/database.module';

@Module({
  imports: [ConfigurationModule, DatabaseModule],
})
export class CliModule {}
