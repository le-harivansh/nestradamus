import { Module } from '@nestjs/common';

import { AuthenticatedUserController } from './controller/authenticated-user.controller';
import { UserController } from './controller/user.controller';
import { UserRepository } from './repository/user.repository';
import { UserSchema } from './schema/user.schema';
import { UserService } from './service/user.service';

@Module({
  controllers: [AuthenticatedUserController, UserController],
  providers: [UserSchema, UserRepository, UserService],
  exports: [UserService],
})
export class UserModule {}
