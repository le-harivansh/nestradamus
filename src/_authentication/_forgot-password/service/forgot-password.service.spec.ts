import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ConfigurationService } from '@/_application/_configuration/service/configuration.service';
import { EventService } from '@/_application/_event/service/event.service';
import { Event } from '@/_application/_event/type';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { MailService } from '@/_application/_mail/service/mail.service';
import { Otp, OtpSchema } from '@/_library/_otp/schema/otp.schema';
import { OtpService } from '@/_library/_otp/service/otp.service';
import { OtpType } from '@/_library/_otp/type';
import { newDocument } from '@/_library/helper';
import { User, UserSchema } from '@/_user/schema/user.schema';
import { UserService } from '@/_user/service/user.service';

import { ForgotPasswordService } from './forgot-password.service';

jest.mock('@/_application/_configuration/service/configuration.service');
jest.mock('@/_application/_logger/service/winston-logger.service');
jest.mock('@/_application/_event/service/event.service');
jest.mock('@/_application/_mail/service/mail.service');
jest.mock('@/_user/service/user.service');
jest.mock('@/_library/_otp/service/otp.service');

describe(ForgotPasswordService.name, () => {
  let configurationService: jest.Mocked<ConfigurationService>;
  let loggerService: jest.Mocked<WinstonLoggerService>;
  let eventService: jest.Mocked<EventService>;
  let mailService: jest.Mocked<MailService>;
  let userService: jest.Mocked<UserService>;
  let otpService: jest.Mocked<OtpService>;
  let forgotPasswordService: ForgotPasswordService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigurationService,
        WinstonLoggerService,
        EventService,
        MailService,
        UserService,
        OtpService,
        ForgotPasswordService,
      ],
    }).compile();

    configurationService = module.get(ConfigurationService);
    loggerService = module.get(WinstonLoggerService);
    eventService = module.get(EventService);
    mailService = module.get(MailService);
    userService = module.get(UserService);
    otpService = module.get(OtpService);
    forgotPasswordService = module.get(ForgotPasswordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(forgotPasswordService).toBeDefined();
  });

  describe('resetPassword', () => {
    const user = newDocument<User>(User, UserSchema, {
      email: 'user@email.com',
      password: 'P@ssw0rd',
    });

    const userResetPasswordData = {
      email: 'user@email.com',
      password: 'dr0wss@P',
      otp: '123456',
    };

    beforeAll(() => {
      otpService.isValid.mockResolvedValue(true);
    });

    it('calls `OtpService::isValid` with the appropriate data', async () => {
      await forgotPasswordService.resetPassword(
        userResetPasswordData.email,
        userResetPasswordData.password,
        userResetPasswordData.otp,
      );

      expect(otpService.isValid).toHaveBeenCalledTimes(1);
      expect(otpService.isValid).toHaveBeenCalledWith(
        userResetPasswordData.otp,
        {
          destination: userResetPasswordData.email,
          type: OtpType.userRegistration.name,
        },
      );
    });

    it('throws a `BadRequestException` if the provided OTP is invalid', async () => {
      otpService.isValid.mockResolvedValueOnce(false);

      expect(
        async () =>
          await forgotPasswordService.resetPassword(
            userResetPasswordData.email,
            userResetPasswordData.password,
            '000000',
          ),
      ).rejects.toThrow(BadRequestException);
    });

    it('calls `UserService::update` with the appropriate arguments', async () => {
      await forgotPasswordService.resetPassword(
        userResetPasswordData.email,
        userResetPasswordData.password,
        userResetPasswordData.otp,
      );

      expect(userService.update).toHaveBeenCalledTimes(1);
      expect(userService.update).toHaveBeenCalledWith(
        { email: user.get('email') },
        {
          password: userResetPasswordData.password,
        },
      );
    });

    it('calls `EventService::emit` with the proper arguments', async () => {
      const updatedUser = user
        .$clone()
        .set('password', userResetPasswordData.password);

      userService.update.mockResolvedValueOnce(updatedUser);

      await forgotPasswordService.resetPassword(
        userResetPasswordData.email,
        userResetPasswordData.password,
        userResetPasswordData.otp,
      );

      expect(eventService.emit).toHaveBeenCalledTimes(1);
      expect(eventService.emit).toHaveBeenCalledWith(
        Event.User.PASSWORD_RESET,
        updatedUser,
      );
    });

    it('logs data about the password-reset', async () => {
      await forgotPasswordService.resetPassword(
        userResetPasswordData.email,
        userResetPasswordData.password,
        userResetPasswordData.otp,
      );

      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Password successfully reset',
        {
          email: userResetPasswordData.email,
        },
      );
    });
  });

  describe('sendOtpEmail', () => {
    const destination = 'user@email.com';

    beforeEach(async () => {
      const otp = newDocument<Otp>(Otp, OtpSchema, {
        type: OtpType.userRegistration.name,
        destination,
        password: '987654',
        expiresAt: new Date(
          Date.now() + OtpType.userRegistration.ttlSeconds * 1000,
        ),
      });

      otpService.create.mockResolvedValueOnce(otp);

      await forgotPasswordService.sendOtpEmail(destination);
    });

    it('calls `MailService::queueSend` with the appropriate arguments', async () => {
      expect(otpService.create).toHaveBeenCalledTimes(1);
      expect(otpService.create).toHaveBeenCalledWith(
        OtpType.userRegistration.name,
        destination,
        OtpType.userRegistration.ttlSeconds,
      );

      expect(configurationService.getOrThrow).toHaveBeenCalledTimes(1);
      expect(configurationService.getOrThrow).toHaveBeenCalledWith(
        'application.name',
      );

      expect(mailService.queueSend).toHaveBeenCalledTimes(1);
      expect(mailService.queueSend).toHaveBeenCalledWith(
        {
          to: destination,
          subject: expect.any(String),
        },
        {
          path: expect.any(String),
          variables: {
            email: destination,
            otp: expect.any(String),
          },
        },
      );
    });

    it('logs data about the forgot-password OTP email to be sent', async () => {
      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Queuing forgot-password OTP mail',
        {
          destination,
        },
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    const destination = 'user@email.com';

    beforeEach(async () => {
      await forgotPasswordService.sendPasswordResetEmail(destination);
    });

    it('calls `MailService::queueSend` with the appropriate arguments', async () => {
      expect(configurationService.getOrThrow).toHaveBeenCalledTimes(1);
      expect(configurationService.getOrThrow).toHaveBeenCalledWith(
        'application.name',
      );

      expect(mailService.queueSend).toHaveBeenCalledTimes(1);
      expect(mailService.queueSend).toHaveBeenCalledWith(
        {
          to: destination,
          subject: expect.any(String),
        },
        {
          path: expect.any(String),
          variables: {
            email: destination,
          },
        },
      );
    });

    it('logs data about the forgot-password OTP email to be sent', async () => {
      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Queuing password-reset mail',
        {
          destination,
        },
      );
    });
  });
});
