import { Injectable } from '@nestjs/common';

import { ConfigurationService } from '@/_application/_configuration/service/configuration.service';
import { MailService } from '@/_application/_mail/service/mail.service';
import { Otp } from '@/_library/_otp/schema/otp.schema';
import { OtpService } from '@/_library/_otp/service/otp.service';

@Injectable()
export class RegistrationService {
  static readonly OTP_TYPE = 'user:registration';
  static readonly OTP_TTL_SECONDS = 5 * 60;

  constructor(
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
    private readonly configurationService: ConfigurationService,
  ) {}

  async sendOtpEmail(destination: Otp['destination']) {
    const createdOtp = await this.otpService.create(
      RegistrationService.OTP_TYPE,
      destination,
      RegistrationService.OTP_TTL_SECONDS,
    );

    const emailSubject = `Your ${this.configurationService.getOrThrow(
      'application.name',
    )} email verification OTP.`;
    const password = createdOtp.get('password');

    return this.mailService.queueSend(
      {
        to: destination,
        subject: emailSubject,
      },
      {
        path: '_registration/template/verify-email.mail.mjml.hbs',
        variables: { password },
      },
    );
  }

  async verifyOtp(
    password: Otp['password'],
    destination: Otp['destination'],
  ): Promise<boolean> {
    return this.otpService.isValid(password, {
      type: RegistrationService.OTP_TYPE,
      destination,
    });
  }
}
