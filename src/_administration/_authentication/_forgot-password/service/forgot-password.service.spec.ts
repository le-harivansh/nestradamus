import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import {
  Administrator,
  AdministratorSchema,
} from '@/_administration/_administrator/schema/administrator.schema';
import { AdministratorService } from '@/_administration/_administrator/service/administrator.service';
import { ConfigurationService } from '@/_application/_configuration/service/configuration.service';
import { EventService } from '@/_application/_event/service/event.service';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { MailService } from '@/_application/_mail/service/mail.service';
import { Otp, OtpSchema } from '@/_library/_otp/schema/otp.schema';
import { OtpService } from '@/_library/_otp/service/otp.service';
import { newDocument } from '@/_library/test.helper';

import { ADMINISTRATOR_PASSWORD_RESET } from '../event';
import { ForgotPasswordService } from './forgot-password.service';

jest.mock('@/_application/_configuration/service/configuration.service');
jest.mock('@/_application/_logger/service/winston-logger.service');
jest.mock('@/_application/_event/service/event.service');
jest.mock('@/_application/_mail/service/mail.service');
jest.mock('@/_administration/_administrator/service/administrator.service');
jest.mock('@/_library/_otp/service/otp.service');

describe(ForgotPasswordService.name, () => {
  let configurationService: jest.Mocked<ConfigurationService>;
  let loggerService: jest.Mocked<WinstonLoggerService>;
  let eventService: jest.Mocked<EventService>;
  let mailService: jest.Mocked<MailService>;
  let administratorService: jest.Mocked<AdministratorService>;
  let otpService: jest.Mocked<OtpService>;
  let forgotPasswordService: ForgotPasswordService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigurationService,
        WinstonLoggerService,
        EventService,
        MailService,
        AdministratorService,
        OtpService,
        ForgotPasswordService,
      ],
    }).compile();

    configurationService = module.get(ConfigurationService);
    loggerService = module.get(WinstonLoggerService);
    eventService = module.get(EventService);
    mailService = module.get(MailService);
    administratorService = module.get(AdministratorService);
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
    const administrator = newDocument<Administrator>(
      Administrator,
      AdministratorSchema,
      {
        username: 'administrator@email.com',
        password: 'P@ssw0rd',
      },
    );

    const administratorResetPasswordData = {
      email: 'administrator@email.com',
      password: 'dr0wss@P',
      otp: '123456',
    };

    beforeAll(() => {
      otpService.isValid.mockResolvedValue(true);
    });

    it('calls `OtpService::isValid` with the appropriate data', async () => {
      await forgotPasswordService.resetPassword(
        administratorResetPasswordData.email,
        administratorResetPasswordData.password,
        administratorResetPasswordData.otp,
      );

      expect(otpService.isValid).toHaveBeenCalledTimes(1);
      expect(otpService.isValid).toHaveBeenCalledWith(
        administratorResetPasswordData.otp,
        {
          destination: administratorResetPasswordData.email,
          type: ForgotPasswordService.OTP.TYPE,
        },
      );
    });

    it('throws a `BadRequestException` if the provided OTP is invalid', async () => {
      otpService.isValid.mockResolvedValueOnce(false);

      expect(
        async () =>
          await forgotPasswordService.resetPassword(
            administratorResetPasswordData.email,
            administratorResetPasswordData.password,
            '000000',
          ),
      ).rejects.toThrow(BadRequestException);
    });

    it('calls `AdministratorService::update` with the appropriate arguments', async () => {
      await forgotPasswordService.resetPassword(
        administratorResetPasswordData.email,
        administratorResetPasswordData.password,
        administratorResetPasswordData.otp,
      );

      expect(administratorService.update).toHaveBeenCalledTimes(1);
      expect(administratorService.update).toHaveBeenCalledWith(
        { username: administratorResetPasswordData.email },
        {
          password: administratorResetPasswordData.password,
        },
      );
    });

    it('calls `EventService::emit` with the proper arguments', async () => {
      const updatedUser = administrator
        .$clone()
        .set('password', administratorResetPasswordData.password);

      administratorService.update.mockResolvedValueOnce(updatedUser);

      await forgotPasswordService.resetPassword(
        administratorResetPasswordData.email,
        administratorResetPasswordData.password,
        administratorResetPasswordData.otp,
      );

      expect(eventService.emit).toHaveBeenCalledTimes(1);
      expect(eventService.emit).toHaveBeenCalledWith(
        ADMINISTRATOR_PASSWORD_RESET,
        updatedUser,
      );
    });

    it('logs data about the password-reset', async () => {
      await forgotPasswordService.resetPassword(
        administratorResetPasswordData.email,
        administratorResetPasswordData.password,
        administratorResetPasswordData.otp,
      );

      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Password successfully reset',
        {
          email: administratorResetPasswordData.email,
        },
      );
    });
  });

  describe('sendOtpEmail', () => {
    const destination = 'administrator@email.com';

    beforeEach(async () => {
      const otp = newDocument<Otp>(Otp, OtpSchema, {
        type: ForgotPasswordService.OTP.TYPE,
        destination,
        password: '987654',
        expiresAt: new Date(
          Date.now() + ForgotPasswordService.OTP.TTL_SECONDS * 1000,
        ),
      });

      otpService.create.mockResolvedValueOnce(otp);

      await forgotPasswordService.sendOtpEmail(destination);
    });

    it('calls `MailService::queueSend` with the appropriate arguments', async () => {
      expect(otpService.create).toHaveBeenCalledTimes(1);
      expect(otpService.create).toHaveBeenCalledWith(
        ForgotPasswordService.OTP.TYPE,
        destination,
        ForgotPasswordService.OTP.TTL_SECONDS,
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
    const destination = 'administrator@email.com';

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
