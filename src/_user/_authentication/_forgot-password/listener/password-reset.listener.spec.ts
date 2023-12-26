import { Test, TestingModule } from '@nestjs/testing';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { newDocument } from '@/_library/test.helper';
import { User, UserSchema } from '@/_user/_user/schema/user.schema';

import { ForgotPasswordService } from '../service/forgot-password.service';
import { PasswordResetListener } from './password-reset.listener';

jest.mock('@/_application/_logger/service/winston-logger.service');
jest.mock('../service/forgot-password.service');

describe(PasswordResetListener.name, () => {
  let loggerService: jest.Mocked<WinstonLoggerService>;
  let forgotPasswordService: jest.Mocked<ForgotPasswordService>;
  let passwordResetListener: PasswordResetListener;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WinstonLoggerService,
        ForgotPasswordService,
        PasswordResetListener,
      ],
    }).compile();

    loggerService = module.get(WinstonLoggerService);
    forgotPasswordService = module.get(ForgotPasswordService);
    passwordResetListener = module.get(PasswordResetListener);
  });

  it('should be defined', () => {
    expect(passwordResetListener).toBeDefined();
  });

  describe('handleUserPasswordReset', () => {
    const user = newDocument<User>(User, UserSchema, {
      username: 'user@email.com',
      password: 'P@ssw0rd',
    });

    beforeEach(async () => {
      await passwordResetListener.handleUserPasswordReset(user);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls `ForgotPasswordService::sendPasswordResetEmail` with the newly updated `User`', async () => {
      expect(
        forgotPasswordService.sendPasswordResetEmail,
      ).toHaveBeenCalledTimes(1);
      expect(forgotPasswordService.sendPasswordResetEmail).toHaveBeenCalledWith(
        user.get('username'),
      );
    });

    it('calls `WinstonLoggerService::log` with the passed in user', async () => {
      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Handling user password-reset',
        user,
      );
    });
  });
});
