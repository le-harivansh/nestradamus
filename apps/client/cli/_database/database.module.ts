import { Module } from '@nestjs/common';

import { DropModule } from './_drop/drop.module';
import { SeedModule } from './_seed/seed.module';
import { DatabaseCommand } from './command/database.command';

@Module({
  imports: [SeedModule, DropModule],
  providers: [DatabaseCommand],
})
export class DatabaseModule {}
