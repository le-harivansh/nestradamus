import { BadRequestException, Injectable } from '@nestjs/common';
import { HydratedDocument } from 'mongoose';
import { join } from 'node:path';

import { ConfigurationService } from '@/_application/_configuration/service/configuration.service';
import { EventService } from '@/_application/_event/service/event.service';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { MailService } from '@/_application/_mail/service/mail.service';
import { OtpService } from '@/_library/_otp/service/otp.service';
import { User } from '@/_user/_user/schema/user.schema';
import { UserService } from '@/_user/_user/service/user.service';

import { USER_REGISTERED } from '../event';

@Injectable()
export class RegistrationService {
  static readonly OTP = {
    TYPE: 'user.registration',
    TTL_SECONDS: 5 * 60,
  } as const;

  constructor(
    private readonly loggerService: WinstonLoggerService,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
    private readonly userService: UserService,
    private readonly eventService: EventService,
    private readonly configurationService: ConfigurationService,
  ) {
    this.loggerService.setContext(RegistrationService.name);
  }

  async registerUser(
    email: string,
    password: string,
    otp: string,
  ): Promise<HydratedDocument<User>> {
    const otpIsValid = await this.otpService.isValid(otp, {
      destination: email,
      type: RegistrationService.OTP.TYPE,
    });

    if (!otpIsValid) {
      throw new BadRequestException(
        `The user-registration OTP (${otp}) sent to: '${email}' is invalid`,
      );
    }

    const newUser = await this.userService.create({
      username: email,
      password,
    });

    this.eventService.emit(USER_REGISTERED, newUser);

    this.loggerService.log('Registered user', newUser);

    return newUser;
  }

  async sendVerificationOtpEmail(destination: string) {
    const createdOtp = await this.otpService.create(
      RegistrationService.OTP.TYPE,
      destination,
      RegistrationService.OTP.TTL_SECONDS,
    );

    this.loggerService.log('Queuing user-registration verification mail', {
      destination,
    });

    return this.mailService.queueSend(
      {
        to: destination,
        subject: `${this.configurationService.getOrThrow(
          'application.name',
        )} - Your email verification OTP.`,
      },
      {
        path: join(__dirname, '..', 'template/verify-email.mail.mjml.hbs'),
        variables: { otp: createdOtp.get('password') },
      },
    );
  }

  async sendWelcomeEmail(destination: string) {
    this.loggerService.log('Queuing user-registration welcome mail', {
      destination,
    });

    return this.mailService.queueSend(
      {
        to: destination,
        subject: `${this.configurationService.getOrThrow(
          'application.name',
        )} - Your account was successfully created!`,
      },
      {
        path: join(__dirname, '..', 'template/welcome.mail.mjml.hbs'),
        variables: {
          email: destination,
        },
      },
    );
  }
}
