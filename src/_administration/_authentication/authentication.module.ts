import { Module } from '@nestjs/common';

import { AdministratorModule } from '../_administrator/administrator.module';
import { ForgotPasswordModule } from './_forgot-password/forgot-password.module';
import { TokenModule } from './_token/token.module';
import { AuthenticationController } from './controller/authentication.controller';
import { AuthenticationService } from './service/authentication.service';

@Module({
  imports: [AdministratorModule, TokenModule, ForgotPasswordModule],
  providers: [AuthenticationService],
  controllers: [AuthenticationController],
})
export class AuthenticationModule {}
