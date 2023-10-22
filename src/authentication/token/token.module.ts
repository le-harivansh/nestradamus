import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { RefreshController } from './refresh.controller';
import tokenConfiguration from './token.config';
import { TokenService } from './token.service';

@Module({
  imports: [
    ConfigModule.forFeature(tokenConfiguration),
    JwtModule.register({}),
  ],
  controllers: [RefreshController],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
