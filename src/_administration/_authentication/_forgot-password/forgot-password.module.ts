import { Module } from '@nestjs/common';

import { AdministratorModule } from '@/_administration/_administrator/administrator.module';
import { MailModule } from '@/_application/_mail/mail.module';
import { OtpModule } from '@/_library/_otp/otp.module';

import { ForgotPasswordController } from './controller/forgot-password.controller';
import { PasswordResetListener } from './listener/password-reset.listener';
import { ForgotPasswordService } from './service/forgot-password.service';

@Module({
  imports: [AdministratorModule, OtpModule, MailModule],
  controllers: [ForgotPasswordController],
  providers: [ForgotPasswordService, PasswordResetListener],
})
export class ForgotPasswordModule {}
