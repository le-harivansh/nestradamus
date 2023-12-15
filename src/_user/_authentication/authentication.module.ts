import { Module } from '@nestjs/common';

import { UserModule } from '../_user/user.module';
import { ForgotPasswordModule } from './_forgot-password/forgot-password.module';
import { TokenModule } from './_token/token.module';
import { AuthenticationController } from './controller/authentication.controller';
import { AuthenticationService } from './service/authentication.service';

@Module({
  imports: [UserModule, TokenModule, ForgotPasswordModule],
  providers: [AuthenticationService],
  controllers: [AuthenticationController],
})
export class AuthenticationModule {}
