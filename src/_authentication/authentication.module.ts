import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { UserModule } from '../_user/user.module';
import authenticationConfiguration from './_token/token.config';
import { TokenModule } from './_token/token.module';
import { AuthenticationController } from './controller/authentication.controller';
import { AccessTokenStrategy } from './strategy/access-token.strategy';
import { LocalStrategy } from './strategy/local.strategy';
import { RefreshTokenStrategy } from './strategy/refresh-token.strategy';

@Module({
  imports: [
    UserModule,
    PassportModule,
    ConfigModule.forFeature(authenticationConfiguration),
    TokenModule,
  ],
  providers: [LocalStrategy, AccessTokenStrategy, RefreshTokenStrategy],
  controllers: [AuthenticationController],
})
export class AuthenticationModule {}
