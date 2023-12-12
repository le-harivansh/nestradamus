import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { UserModule } from '../_user/user.module';
import { ForgotPasswordModule } from './_forgot-password/forgot-password.module';
import { TokenModule } from './_token/token.module';
import { AuthenticationController } from './controller/authentication.controller';
import { AccessTokenStrategy } from './strategy/access-token.strategy';
import { LocalStrategy } from './strategy/local.strategy';
import { RefreshTokenStrategy } from './strategy/refresh-token.strategy';

@Module({
  imports: [UserModule, PassportModule, TokenModule, ForgotPasswordModule],
  providers: [LocalStrategy, AccessTokenStrategy, RefreshTokenStrategy],
  controllers: [AuthenticationController],
})
export class AuthenticationModule {}
