import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ConfigurationService } from '@/_application/_configuration/service/configuration.service';
import { MailService } from '@/_application/_mail/service/mail.service';
import { USER_REGISTERED } from '@/_application/event.constant';
import { Otp } from '@/_library/_otp/schema/otp.schema';
import { OtpService } from '@/_library/_otp/service/otp.service';
import { UserDocument } from '@/_user/schema/user.schema';
import { UserService } from '@/_user/service/user.service';

@Injectable()
export class RegistrationService {
  static readonly OTP_TYPE = 'user:registration';
  static readonly OTP_TTL_SECONDS = 5 * 60;

  constructor(
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configurationService: ConfigurationService,
  ) {}

  async verifyOtp(
    password: Otp['password'],
    destination: Otp['destination'],
  ): Promise<boolean> {
    return this.otpService.isValid(password, {
      type: RegistrationService.OTP_TYPE,
      destination,
    });
  }

  async registerUser(
    email: string,
    password: string,
    otp: string,
  ): Promise<UserDocument> {
    const otpIsValid = await this.verifyOtp(otp, email);

    if (!otpIsValid) {
      throw new BadRequestException(
        `The user-registration OTP (${otp}) sent to: '${email}' is invalid`,
      );
    }

    const newUser = await this.userService.create(email, password);

    this.eventEmitter.emit(USER_REGISTERED, newUser);

    return newUser;
  }

  async sendEmailVerificationOtpEmail(destination: Otp['destination']) {
    const createdOtp = await this.otpService.create(
      RegistrationService.OTP_TYPE,
      destination,
      RegistrationService.OTP_TTL_SECONDS,
    );

    const subject = `Your ${this.configurationService.getOrThrow(
      'application.name',
    )} email verification OTP.`;
    const password = createdOtp.get('password');

    return this.mailService.queueSend(
      {
        to: destination,
        subject,
      },
      {
        path: '_registration/template/verify-email.mail.mjml.hbs',
        variables: { password },
      },
    );
  }

  async sendWelcomeEmail(destination: string) {
    const applicationName =
      this.configurationService.getOrThrow('application.name');

    const subject = `Account successfully created on ${applicationName}!`;

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
