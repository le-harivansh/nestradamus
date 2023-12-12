import { BadRequestException, Injectable } from '@nestjs/common';

import { ConfigurationService } from '@/_application/_configuration/service/configuration.service';
import { EventService } from '@/_application/_event/service/event.service';
import { Event } from '@/_application/_event/type';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { MailService } from '@/_application/_mail/service/mail.service';
import { OtpService } from '@/_library/_otp/service/otp.service';
import { OtpType } from '@/_library/_otp/type';
import { UserDocument } from '@/_user/schema/user.schema';
import { UserService } from '@/_user/service/user.service';

@Injectable()
export class RegistrationService {
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
  ): Promise<UserDocument> {
    const otpIsValid = await this.otpService.isValid(otp, {
      destination: email,
      type: OtpType.userRegistration.name,
    });

    if (!otpIsValid) {
      throw new BadRequestException(
        `The user-registration OTP (${otp}) sent to: '${email}' is invalid`,
      );
    }

    const newUser = await this.userService.create(email, password);

    this.eventService.emit(Event.User.REGISTERED, newUser);

    this.loggerService.log('Registered user', newUser);

    return newUser;
  }

  async sendEmailVerificationOtpEmail(destination: string) {
    const createdOtp = await this.otpService.create(
      OtpType.userRegistration.name,
      destination,
      OtpType.userRegistration.ttlSeconds,
    );
    const applicationName =
      this.configurationService.getOrThrow('application.name');

    const subject = `${applicationName} - Your email verification OTP.`;
    const otp = createdOtp.get('password');

    this.loggerService.log('Queuing registration verification mail', {
      destination,
    });

    return this.mailService.queueSend(
      {
        to: destination,
        subject,
      },
      {
        path: '_registration/template/verify-email.mail.mjml.hbs',
        variables: { otp },
      },
    );
  }

  async sendWelcomeEmail(destination: string) {
    const applicationName =
      this.configurationService.getOrThrow('application.name');

    const subject = `${applicationName} - Your account was successfully created!`;

    this.loggerService.log('Queuing registration welcome mail', {
      destination,
    });

    return this.mailService.queueSend(
      {
        to: destination,
        subject,
      },
      {
        path: '_registration/template/welcome.mail.mjml.hbs',
        variables: {
          email: destination,
          applicationName,
        },
      },
    );
  }
}
