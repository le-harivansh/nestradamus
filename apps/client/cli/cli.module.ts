import { Module } from '@nestjs/common';

import { ApplicationModule } from '../src/application.module';
import { DatabaseModule } from './_database/database.module';

@Module({
  imports: [ApplicationModule, DatabaseModule],
})
export class CliModule {}
