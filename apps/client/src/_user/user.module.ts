import { Module } from '@nestjs/common';

import { UserRepository } from './repository/user.repository';
import { UserSchema } from './schema/user.schema';
import { UserService } from './service/user.service';

@Module({
  providers: [UserSchema, UserRepository, UserService],
  exports: [UserService],
})
export class UserModule {}
