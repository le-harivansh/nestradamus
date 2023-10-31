import { Module } from '@nestjs/common';

import { FactoryModule } from '../_factory/factory.module';
import { DatabaseSeeder } from './seeder/database.seeder';

@Module({
  imports: [FactoryModule],
  providers: [DatabaseSeeder],
})
export class SeederModule {}
