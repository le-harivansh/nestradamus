import { Module } from '@nestjs/common';

import { MailModule } from '@/_application/_mail/mail.module';
import { OtpModule } from '@/_library/_otp/otp.module';

import { UserModule } from '../_user/user.module';
import { RegistrationController } from './controller/registration.controller';
import { RegistrationListener } from './listener/registration.listener';
import { RegistrationService } from './service/registration.service';

@Module({
  imports: [UserModule, OtpModule, MailModule],
  controllers: [RegistrationController],
  providers: [RegistrationService, RegistrationListener],
})
export class RegistrationModule {}
