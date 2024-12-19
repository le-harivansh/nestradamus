import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule as ClientDatabaseModule } from '../../src/_database/database.module';
import applicationConfiguration from '../../src/application.config';
import { DropModule } from './_drop/drop.module';
import { InitializationModule } from './_initialize/initialization.module';
import { SeedModule } from './_seed/seed.module';
import { DatabaseCommand } from './command/database.command';

@Module({
  imports: [
    ConfigModule.forFeature(applicationConfiguration),
    ClientDatabaseModule,

    InitializationModule,
    DropModule,
    SeedModule,
  ],
  providers: [DatabaseCommand],
})
export class DatabaseModule {}
