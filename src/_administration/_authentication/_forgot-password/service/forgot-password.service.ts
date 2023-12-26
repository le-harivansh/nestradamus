import { BadRequestException, Injectable } from '@nestjs/common';
import { join } from 'node:path';

import { AdministratorService } from '@/_administration/_administrator/service/administrator.service';
import { ConfigurationService } from '@/_application/_configuration/service/configuration.service';
import { EventService } from '@/_application/_event/service/event.service';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { MailService } from '@/_application/_mail/service/mail.service';
import { OtpService } from '@/_library/_otp/service/otp.service';

import { ADMINISTRATOR_PASSWORD_RESET } from '../event';

@Injectable()
export class ForgotPasswordService {
  static readonly OTP = {
    TYPE: 'administrator.password-reset',
    TTL_SECONDS: 5 * 60,
  } as const;

  constructor(
    private readonly loggerService: WinstonLoggerService,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
    private readonly administratorService: AdministratorService,
    private readonly eventService: EventService,
    private readonly configurationService: ConfigurationService,
  ) {
    this.loggerService.setContext(
      `${ForgotPasswordService.name}[Administrator]`,
    );
  }

  async sendOtpEmail(destination: string) {
    const applicationName =
      this.configurationService.getOrThrow('application.name');

    const createdOtp = await this.otpService.create(
      ForgotPasswordService.OTP.TYPE,
      destination,
      ForgotPasswordService.OTP.TTL_SECONDS,
    );

    const subject = `${applicationName} - Forgot your administrator login password?`;

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

  async resetPassword(
    email: string,
    password: string,
    otp: string,
  ): Promise<void> {
    const otpIsValid = await this.otpService.isValid(otp, {
      destination: email,
      type: ForgotPasswordService.OTP.TYPE,
    });

    if (!otpIsValid) {
      throw new BadRequestException(
        `The forgot-password OTP (${otp}) for '${email}' is not valid.`,
      );
    }

    const updatedAdministrator = await this.administratorService.update(
      { username: email },
      { password },
    );

    this.loggerService.log('Password successfully reset', { email });

    this.eventService.emit(ADMINISTRATOR_PASSWORD_RESET, updatedAdministrator);
  }

  async sendPasswordResetEmail(destination: string) {
    const applicationName =
      this.configurationService.getOrThrow('application.name');

    const subject = `${applicationName} - Administrator login password successfully reset!`;

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
