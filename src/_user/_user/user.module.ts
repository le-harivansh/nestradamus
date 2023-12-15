import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TokenModule } from '../_authentication/_token/token.module';
import { UserController } from './controller/user.controller';
import { User, UserSchema } from './schema/user.schema';
import { UserService } from './service/user.service';

@Module({
  imports: [
    forwardRef(() => TokenModule), // needed because of `RequiresUserAccessToken`/`RequiresUserRefreshToken` guards
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
