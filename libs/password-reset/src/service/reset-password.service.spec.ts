import { Test, TestingModule } from '@nestjs/testing';

import { PASSWORD_RESET_MODULE_OPTIONS_TOKEN } from '../password-reset.module-definition';
import { ResetPasswordService } from './reset-password.service';

describe(ResetPasswordService.name, () => {
  const passwordResetModuleOptions = {
    callback: {
      resetUserPassword: jest.fn(),
    },
  } as const;

  let resetPasswordService: ResetPasswordService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PASSWORD_RESET_MODULE_OPTIONS_TOKEN,
          useValue: passwordResetModuleOptions,
        },
        ResetPasswordService,
      ],
    }).compile();

    resetPasswordService = module.get(ResetPasswordService);
  });

  it('should be defined', () => {
    expect(resetPasswordService).toBeDefined();
  });

  describe(ResetPasswordService.prototype.resetUserPassword.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls the provided callback with the provided password-reset instance & new password', async () => {
      const passwordReset = Symbol('Password-Reset');
      const newPassword = 'new-password';

      await resetPasswordService.resetUserPassword(passwordReset, newPassword);

      expect(
        passwordResetModuleOptions.callback.resetUserPassword,
      ).toHaveBeenCalledTimes(1);
      expect(
        passwordResetModuleOptions.callback.resetUserPassword,
      ).toHaveBeenCalledWith(passwordReset, newPassword);
    });

    it('anchors any error thrown through the callback to the current call-stack', async () => {
      const error = new Error();

      passwordResetModuleOptions.callback.resetUserPassword.mockImplementationOnce(
        () => {
          throw error;
        },
      );

      await expect(
        resetPasswordService.resetUserPassword(
          Symbol('Password-Reset'),
          'new-password',
        ),
      ).rejects.toThrow(error);
    });
  });
});
