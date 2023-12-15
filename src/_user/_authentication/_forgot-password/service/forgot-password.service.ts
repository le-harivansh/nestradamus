import { BadRequestException, Injectable } from '@nestjs/common';
import { join } from 'node:path';

import { ConfigurationService } from '@/_application/_configuration/service/configuration.service';
import { EventService } from '@/_application/_event/service/event.service';
import { Event } from '@/_application/_event/type';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { MailService } from '@/_application/_mail/service/mail.service';
import { OtpService } from '@/_library/_otp/service/otp.service';
import { OtpType } from '@/_library/_otp/type';
import { UserService } from '@/_user/_user/service/user.service';

@Injectable()
export class ForgotPasswordService {
  constructor(
    private readonly loggerService: WinstonLoggerService,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
    private readonly userService: UserService,
    private readonly eventService: EventService,
    private readonly configurationService: ConfigurationService,
  ) {
    this.loggerService.setContext(ForgotPasswordService.name);
  }

  async resetPassword(
    email: string,
    password: string,
    otp: string,
  ): Promise<void> {
    const otpIsValid = await this.otpService.isValid(otp, {
      destination: email,
      type: OtpType.userRegistration.name,
    });

    if (!otpIsValid) {
      throw new BadRequestException(
        `The forgot-password OTP (${otp}) sent to: '${email}' is invalid`,
      );
    }

    const updatedUser = await this.userService.update(
      { email },
      {
        password,
      },
    );

    this.loggerService.log('Password successfully reset', { email });

    this.eventService.emit(Event.User.PASSWORD_RESET, updatedUser);
  }

  async sendOtpEmail(destination: string) {
    const applicationName =
      this.configurationService.getOrThrow('application.name');

    const createdOtp = await this.otpService.create(
      OtpType.userRegistration.name,
      destination,
      OtpType.userRegistration.ttlSeconds,
    );

    const subject = `${applicationName} - Forgot your password?`;

    this.loggerService.log('Queuing forgot-password OTP mail', {
      destination,
    });

    return this.mailService.queueSend(
      {
        to: destination,
        subject,
      },
      {
        path: join(__dirname, '..', 'template/forgot-password.mail.mjml.hbs'),
        variables: {
          email: destination,
          otp: createdOtp.get('password'),
        },
      },
    );
  }

  async sendPasswordResetEmail(destination: string) {
    const applicationName =
      this.configurationService.getOrThrow('application.name');

    const subject = `${applicationName} - Password successfully reset!`;

    this.loggerService.log('Queuing password-reset mail', {
      destination,
    });

    return this.mailService.queueSend(
      {
        to: destination,
        subject,
      },
      {
        path: join(__dirname, '..', 'template/password-reset.mail.mjml.hbs'),
        variables: {
          email: destination,
        },
      },
    );
  }
}
