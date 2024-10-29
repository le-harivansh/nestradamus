import { Test, TestingModule } from '@nestjs/testing';

import { PASSWORD_RESET_MODULE_OPTIONS_TOKEN } from '../password-reset.module-definition';
import { PasswordResetService } from '../service/password-reset.service';
import { ResetPasswordService } from '../service/reset-password.service';
import { ResetPasswordController } from './reset-password.controller';

jest.mock('../service/password-reset.service');
jest.mock('../service/reset-password.service');

describe(ResetPasswordController.name, () => {
  const passwordResetModuleOptions = {
    route: {
      resetPassword: 'reset-password/:id',
    },
  };

  let resetPasswordController: ResetPasswordController;

  let passwordResetService: jest.Mocked<PasswordResetService>;
  let resetPasswordService: jest.Mocked<ResetPasswordService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResetPasswordController],
      providers: [
        {
          provide: PASSWORD_RESET_MODULE_OPTIONS_TOKEN,
          useValue: passwordResetModuleOptions,
        },
        PasswordResetService,
        ResetPasswordService,
      ],
    }).compile();

    resetPasswordController = module.get(ResetPasswordController);

    passwordResetService = module.get(PasswordResetService);
    resetPasswordService = module.get(ResetPasswordService);
  });

  it('should be defined', () => {
    expect(resetPasswordController).toBeDefined();
  });

  describe(ResetPasswordController.prototype.getPasswordReset.name, () => {
    const passwordResetId = 'password-reset-id';
    const passwordReset = Symbol('Password-Reset');

    let resultingPasswordReset: unknown;

    beforeAll(async () => {
      passwordResetService.findById.mockResolvedValueOnce(passwordReset);

      resultingPasswordReset =
        await resetPasswordController.getPasswordReset(passwordResetId);
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it(`calls '${PasswordResetService.name}::${PasswordResetService.prototype.findById.name}' with the provided password-reset id`, () => {
      expect(passwordResetService.findById).toHaveBeenCalledTimes(1);
      expect(passwordResetService.findById).toHaveBeenCalledWith(
        passwordResetId,
      );
    });

    it(`returns the result of '${PasswordResetService.name}::${PasswordResetService.prototype.findById.name}'`, () => {
      expect(resultingPasswordReset).toBe(passwordReset);
    });
  });

  describe(ResetPasswordController.prototype.updateUserPassword.name, () => {
    const passwordResetId = 'password-reset-id';
    const newPassword = 'new-password';
    const passwordReset = Symbol('Password-Reset');

    beforeAll(async () => {
      passwordResetService.findById.mockResolvedValueOnce(passwordReset);

      await resetPasswordController.updateUserPassword(passwordResetId, {
        newPassword,
      });
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it(`calls '${PasswordResetService.name}::${PasswordResetService.prototype.findById.name}' with the provided password-reset id`, () => {
      expect(passwordResetService.findById).toHaveBeenCalledTimes(1);
      expect(passwordResetService.findById).toHaveBeenCalledWith(
        passwordResetId,
      );
    });

    it(`calls '${ResetPasswordService.name}::${ResetPasswordService.prototype.resetUserPassword.name}' with the provided password-reset id`, () => {
      expect(resetPasswordService.resetUserPassword).toHaveBeenCalledTimes(1);
      expect(resetPasswordService.resetUserPassword).toHaveBeenCalledWith(
        passwordReset,
        newPassword,
      );
    });

    it(`calls '${PasswordResetService.name}::${PasswordResetService.prototype.delete.name}' with the provided password-reset id`, () => {
      expect(passwordResetService.findById).toHaveBeenCalledTimes(1);
      expect(passwordResetService.findById).toHaveBeenCalledWith(
        passwordResetId,
      );
    });
  });
});
