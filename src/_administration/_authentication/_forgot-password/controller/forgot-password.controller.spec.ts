import { Test, TestingModule } from '@nestjs/testing';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';

import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ForgotPasswordService } from '../service/forgot-password.service';
import { ForgotPasswordController } from './forgot-password.controller';

jest.mock('@/_application/_logger/service/winston-logger.service');
jest.mock('../service/forgot-password.service');

describe(ForgotPasswordController.name, () => {
  let loggerService: jest.Mocked<WinstonLoggerService>;
  let forgotPasswordService: jest.Mocked<ForgotPasswordService>;
  let forgotPasswordController: ForgotPasswordController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ForgotPasswordController],
      providers: [WinstonLoggerService, ForgotPasswordService],
    }).compile();

    loggerService = module.get(WinstonLoggerService);
    forgotPasswordService = module.get(ForgotPasswordService);
    forgotPasswordController = module.get(ForgotPasswordController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(forgotPasswordController).toBeDefined();
  });

  describe('sendOtp', () => {
    const destination = 'administrator@email.com';

    beforeEach(async () => {
      await forgotPasswordController.sendOtp({ destination });
    });

    it('calls `ForgotPasswordService::sendOtpEmail` with the provided destination', async () => {
      expect(forgotPasswordService.sendOtpEmail).toBeCalledTimes(1);
      expect(forgotPasswordService.sendOtpEmail).toBeCalledWith(destination);
    });

    it('logs the forgot-password OTP request data', () => {
      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Received administrator forgot-password OTP request',
        { destination },
      );
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto: ResetPasswordDto = {
      email: 'administrator@email.com',
      password: 'P@ssw0rd',
      otp: '123456',
    };

    beforeEach(async () => {
      await forgotPasswordController.resetPassword(resetPasswordDto);
    });

    it('calls `ForgotPasswordService::resetPassword` with the appropriate arguments', async () => {
      expect(forgotPasswordService.resetPassword).toHaveBeenCalledTimes(1);
      expect(forgotPasswordService.resetPassword).toHaveBeenCalledWith(
        resetPasswordDto.email,
        resetPasswordDto.password,
        resetPasswordDto.otp,
      );
    });

    it('logs the password-reset request data', () => {
      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Received administrator password-reset request',
        {
          email: resetPasswordDto.email,
        },
      );
    });
  });
});
