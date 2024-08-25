import { Module } from '@nestjs/common';

import { UserModule } from '../../../src/_user/user.module';
import { SeederCommand } from './command/seeder.command';

@Module({
  imports: [UserModule],
  providers: [SeederCommand],
})
export class SeederModule {}
