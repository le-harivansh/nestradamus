import { Module } from '@nestjs/common';

import { UserRepository } from '../../../src/_user/repository/user.repository';
import { UserService } from '../../../src/_user/service/user.service';
import { SeederCommand } from './command/seeder.command';

@Module({
  providers: [
    // User entity CRUD
    UserRepository,
    UserService,

    SeederCommand,
  ],
})
export class SeederModule {}
