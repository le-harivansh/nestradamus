import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { LoggerModule } from '@/_application/_logger/logger.module';
import { UserModule } from '@/_user/_user/user.module';

import { RefreshController } from './controller/refresh.controller';
import { TokenService } from './service/token.service';
import tokenConfiguration from './token.config';

@Module({
  imports: [
    forwardRef(() => UserModule),
    LoggerModule,
    ConfigModule.forFeature(tokenConfiguration),
    JwtModule.register({}),
  ],
  controllers: [RefreshController],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
