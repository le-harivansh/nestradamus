import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AdministratorModule } from '@/_administration/_administrator/administrator.module';
import { LoggerModule } from '@/_application/_logger/logger.module';

import { RefreshController } from './controller/refresh.controller';
import { TokenService } from './service/token.service';
import tokenConfiguration from './token.config';

@Module({
  imports: [
    forwardRef(() => AdministratorModule),
    LoggerModule,
    ConfigModule.forFeature(tokenConfiguration),
    JwtModule.register({}),
  ],
  controllers: [RefreshController],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
