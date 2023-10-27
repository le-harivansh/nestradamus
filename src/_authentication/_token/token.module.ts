import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { RefreshController } from './controller/refresh.controller';
import { TokenService } from './service/token.service';
import tokenConfiguration from './token.config';

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
