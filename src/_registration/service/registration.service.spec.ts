import { Test, TestingModule } from '@nestjs/testing';

import { ConfigurationService } from '@/_application/_configuration/service/configuration.service';
import { MailService } from '@/_application/_mail/service/mail.service';
import { OtpService } from '@/_library/_otp/service/otp.service';
import { MockOf } from '@/_library/helper';

import { RegistrationService } from './registration.service';

describe(RegistrationService.name, () => {
  const otpPassword = '123456';
  const otpServiceMock: MockOf<OtpService, 'isValid' | 'create'> = {
    isValid: jest.fn().mockReturnValue(true),
    create: jest.fn(() => ({
      get: (property: string) =>
        ({
          password: otpPassword,
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
      const password = '123456';
      const destination = 'user@email.com';

      const verificationResult = await registrationService.verifyOtp(
        password,
        destination,
      );

      expect(otpServiceMock.isValid).toHaveBeenCalledTimes(1);
      expect(otpServiceMock.isValid).toHaveBeenCalledWith(password, {
        type: RegistrationService.OTP_TYPE,
        destination,
      });

      expect(verificationResult).toBe(true);
    });
  });

  describe('sendOtpEmail', () => {
    it('calls `MailService::queueSend` with the supplied destination', async () => {
      const destination = 'user@email.com';

      await registrationService.sendOtpEmail(destination);

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
});
