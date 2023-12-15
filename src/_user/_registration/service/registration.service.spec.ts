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
import { User, UserSchema } from '@/_user/_user/schema/user.schema';
import { UserService } from '@/_user/_user/service/user.service';

import { RegistrationService } from './registration.service';

jest.mock('@/_application/_configuration/service/configuration.service');
jest.mock('@/_application/_logger/service/winston-logger.service');
jest.mock('@/_application/_event/service/event.service');
jest.mock('@/_application/_mail/service/mail.service');
jest.mock('@/_user/_user/service/user.service');
jest.mock('@/_library/_otp/service/otp.service');

describe(RegistrationService.name, () => {
  const newUser = newDocument<User>(User, UserSchema, {
    email: 'user@email.com',
    password: 'P@ssw0rd',
  });

  let configurationService: jest.Mocked<ConfigurationService>;
  let loggerService: jest.Mocked<WinstonLoggerService>;
  let eventService: jest.Mocked<EventService>;
  let mailService: jest.Mocked<MailService>;
  let userService: jest.Mocked<UserService>;
  let otpService: jest.Mocked<OtpService>;
  let registrationService: RegistrationService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigurationService,
        WinstonLoggerService,
        EventService,
        MailService,
        UserService,
        OtpService,
        RegistrationService,
      ],
    }).compile();

    configurationService = module.get(ConfigurationService);
    loggerService = module.get(WinstonLoggerService);
    eventService = module.get(EventService);
    mailService = module.get(MailService);
    userService = module.get(UserService);
    otpService = module.get(OtpService);
    registrationService = module.get(RegistrationService);

    userService.create.mockResolvedValue(newUser);
    otpService.isValid.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(registrationService).toBeDefined();
  });

  describe('registerUser', () => {
    const userRegistrationData = {
      email: 'user@email.com',
      password: 'P@ssw0rd',
      otp: '109854',
    };

    it('calls `OtpService::isValid` with the appropriate arguments', async () => {
      await registrationService.registerUser(
        userRegistrationData.email,
        userRegistrationData.password,
        userRegistrationData.otp,
      );

      expect(otpService.isValid).toHaveBeenCalledTimes(1);
      expect(otpService.isValid).toHaveBeenCalledWith(
        userRegistrationData.otp,
        {
          destination: userRegistrationData.email,
          type: OtpType.userRegistration.name,
        },
      );
    });

    it('calls `UserService::createUser` with the appropriate arguments', async () => {
      await registrationService.registerUser(
        userRegistrationData.email,
        userRegistrationData.password,
        userRegistrationData.otp,
      );

      expect(userService.create).toHaveBeenCalledTimes(1);
      expect(userService.create).toHaveBeenCalledWith(
        userRegistrationData.email,
        userRegistrationData.password,
      );
    });

    it('throws a `BadRequestException` if the provided OTP is invalid', async () => {
      otpService.isValid.mockResolvedValueOnce(false);

      await expect(() =>
        registrationService.registerUser(
          userRegistrationData.email,
          userRegistrationData.password,
          '000000',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns the created user document', async () => {
      await expect(
        registrationService.registerUser(
          userRegistrationData.email,
          userRegistrationData.password,
          userRegistrationData.otp,
        ),
      ).resolves.toBe(newUser);
    });

    it('calls `EventService::emit` with the proper arguments', async () => {
      const newUser = await registrationService.registerUser(
        userRegistrationData.email,
        userRegistrationData.password,
        userRegistrationData.otp,
      );

      expect(eventService.emit).toHaveBeenCalledTimes(1);
      expect(eventService.emit).toHaveBeenCalledWith(
        Event.User.REGISTERED,
        newUser,
      );
    });

    it('logs data about the newly created user', async () => {
      await expect(
        registrationService.registerUser(
          userRegistrationData.email,
          userRegistrationData.password,
          userRegistrationData.otp,
        ),
      ).resolves.toBe(newUser);

      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Registered user',
        newUser,
      );
    });
  });

  describe('sendVerificationOtpEmail', () => {
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

      await registrationService.sendVerificationOtpEmail(destination);
    });

    it('calls `MailService::queueSend` with the appropriate arguments', () => {
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
            otp: expect.any(String),
          },
        },
      );
    });

    it('logs data about the registration verification email queuing', () => {
      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Queuing user-registration verification mail',
        { destination },
      );
    });
  });

  describe('sendWelcomeEmail', () => {
    const destination = 'user@email.com';

    beforeEach(async () => {
      await registrationService.sendWelcomeEmail(destination);
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
            applicationName:
              configurationService.getOrThrow('application.name'),
          },
        },
      );
    });

    it('logs data about the registration welcome email queuing', () => {
      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Queuing user-registration welcome mail',
        { destination },
      );
    });
  });
});
