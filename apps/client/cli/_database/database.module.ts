import { Module } from '@nestjs/common';

import { DropModule } from './_drop/drop.module';
import { SeederModule } from './_seeder/seeder.module';
import { DatabaseCommand } from './command/database.command';

@Module({
  imports: [SeederModule, DropModule],
  providers: [DatabaseCommand],
})
export class DatabaseModule {}
