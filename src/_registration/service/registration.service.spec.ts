import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { Types, model } from 'mongoose';

import { ConfigurationService } from '@/_application/_configuration/service/configuration.service';
import { MailService } from '@/_application/_mail/service/mail.service';
import { USER_REGISTERED } from '@/_application/event.constant';
import { OtpService } from '@/_library/_otp/service/otp.service';
import { MockOf } from '@/_library/helper';
import { User, UserSchema } from '@/_user/schema/user.schema';
import { UserService } from '@/_user/service/user.service';

import { RegistrationService } from './registration.service';

describe(RegistrationService.name, () => {
  const UserModel = model(User.name, UserSchema);
  const newUser = new UserModel({
    _id: new Types.ObjectId(),
    email: 'user@email.com',
    password: 'P@ssw0rd',
  });
  const userServiceMock: MockOf<UserService, 'create'> = {
    create: jest.fn(() => Promise.resolve(newUser)),
  };

  const validOtp = '123456';
  const otpServiceMock: MockOf<OtpService, 'isValid' | 'create'> = {
    isValid: jest.fn((otp) => otp === validOtp),
    create: jest.fn(() => ({
      get: (property: string) =>
        ({
          password: validOtp,
        })[property],
    })),
  };

  const configurationServiceMock: MockOf<ConfigurationService, 'getOrThrow'> = {
    getOrThrow: jest.fn(
      (key: string) =>
        ({
          'application.name': 'Application',
        })[key],
    ),
  };

  const eventEmitterMock: MockOf<EventEmitter2, 'emit'> = {
    emit: jest.fn(),
  };

  const mailServiceMock: MockOf<MailService, 'queueSend'> = {
    queueSend: jest.fn(),
  };

  let registrationService: RegistrationService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigurationService,
          useValue: configurationServiceMock,
        },
        {
          provide: EventEmitter2,
          useValue: eventEmitterMock,
        },
        {
          provide: UserService,
          useValue: userServiceMock,
        },
        {
          provide: OtpService,
          useValue: otpServiceMock,
        },
        {
          provide: MailService,
          useValue: mailServiceMock,
        },
        RegistrationService,
      ],
    }).compile();

    registrationService = module.get<RegistrationService>(RegistrationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(registrationService).toBeDefined();
  });

  describe('verifyOtp', () => {
    it('calls `OtpService::isValid` with the provided arguments', async () => {
      const destination = 'user@email.com';

      const verificationResult = await registrationService.verifyOtp(
        validOtp,
        destination,
      );

      expect(otpServiceMock.isValid).toHaveBeenCalledTimes(1);
      expect(otpServiceMock.isValid).toHaveBeenCalledWith(validOtp, {
        type: RegistrationService.OTP_TYPE,
        destination,
      });

      expect(verificationResult).toBe(true);
    });
  });

  describe('registerUser', () => {
    const userRegistrationData = {
      email: 'user@email.com',
      password: 'P@ssw0rd',
      otp: validOtp,
    };

    it('calls `UserService::createUser` with the appropriate data', async () => {
      await registrationService.registerUser(
        userRegistrationData.email,
        userRegistrationData.password,
        userRegistrationData.otp,
      );

      expect(userServiceMock.create).toHaveBeenCalledTimes(1);
      expect(userServiceMock.create).toHaveBeenCalledWith(
        userRegistrationData.email,
        userRegistrationData.password,
      );
    });

    it('throws a `BadRequestException` if the provided OTP is invalid', async () => {
      expect(
        async () =>
          await registrationService.registerUser(
            userRegistrationData.email,
            userRegistrationData.password,
            '000000',
          ),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns the created user document', async () => {
      const result = await registrationService.registerUser(
        userRegistrationData.email,
        userRegistrationData.password,
        userRegistrationData.otp,
      );

      expect(result).toBe(newUser);
    });

    it('calls `EventEmitter2::emit` with the proper arguments', async () => {
      const newUser = await registrationService.registerUser(
        userRegistrationData.email,
        userRegistrationData.password,
        userRegistrationData.otp,
      );

      expect(eventEmitterMock.emit).toHaveBeenCalledTimes(1);
      expect(eventEmitterMock.emit).toHaveBeenCalledWith(
        USER_REGISTERED,
        newUser,
      );
    });
  });

  describe('sendEmailVerificationOtpEmail', () => {
    it('calls `MailService::queueSend` with the appropriate arguments', async () => {
      const destination = 'user@email.com';

      await registrationService.sendEmailVerificationOtpEmail(destination);

      expect(otpServiceMock.create).toHaveBeenCalledTimes(1);
      expect(otpServiceMock.create).toHaveBeenCalledWith(
        RegistrationService.OTP_TYPE,
        destination,
        RegistrationService.OTP_TTL_SECONDS,
      );

      expect(configurationServiceMock.getOrThrow).toHaveBeenCalledTimes(1);
      expect(configurationServiceMock.getOrThrow).toHaveBeenCalledWith(
        'application.name',
      );

      expect(mailServiceMock.queueSend).toHaveBeenCalledTimes(1);
      expect(mailServiceMock.queueSend).toHaveBeenCalledWith(
        {
          to: destination,
          subject: expect.any(String),
        },
        {
          path: expect.any(String),
          variables: {
            password: expect.any(String),
          },
        },
      );
    });
  });

  describe('sendWelcomeEmail', () => {
    it('calls `MailService::queueSend` with the appropriate arguments', async () => {
      const destination = 'user@email.com';

      await registrationService.sendWelcomeEmail(destination);

      expect(configurationServiceMock.getOrThrow).toHaveBeenCalledTimes(1);
      expect(configurationServiceMock.getOrThrow).toHaveBeenCalledWith(
        'application.name',
      );

      expect(mailServiceMock.queueSend).toHaveBeenCalledTimes(1);
      expect(mailServiceMock.queueSend).toHaveBeenCalledWith(
        {
          to: destination,
          subject: expect.any(String),
        },
        {
          path: expect.any(String),
          variables: {
            email: destination,
            applicationName:
              configurationServiceMock.getOrThrow('application.name'),
          },
        },
      );
    });
  });
});
