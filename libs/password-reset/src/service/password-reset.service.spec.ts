import { Test, TestingModule } from '@nestjs/testing';

import { PASSWORD_RESET_MODULE_OPTIONS_TOKEN } from '../password-reset.module-definition';
import { PasswordResetService } from './password-reset.service';

describe(PasswordResetService.name, () => {
  const passwordResetModuleOptions = {
    callback: {
      retrievePasswordReset: jest.fn(),
      createPasswordReset: jest.fn(),
      deletePasswordReset: jest.fn(),
    },
  } as const;

  let passwordResetService: PasswordResetService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PASSWORD_RESET_MODULE_OPTIONS_TOKEN,
          useValue: passwordResetModuleOptions,
        },
        PasswordResetService,
      ],
    }).compile();

    passwordResetService = module.get(PasswordResetService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(passwordResetService).toBeDefined();
  });

  describe(PasswordResetService.prototype.findById.name, () => {
    it('calls the provided callback with the provided user & password-request', async () => {
      const passwordResetId = 'password-reset-id';

      await passwordResetService.findById(passwordResetId);

      expect(
        passwordResetModuleOptions.callback.retrievePasswordReset,
      ).toHaveBeenCalledTimes(1);
      expect(
        passwordResetModuleOptions.callback.retrievePasswordReset,
      ).toHaveBeenCalledWith(passwordResetId);
    });

    it('returns the result of the provided callback', async () => {
      const passwordReset = Symbol('Resolved password-reset');

      passwordResetModuleOptions.callback.retrievePasswordReset.mockResolvedValueOnce(
        passwordReset,
      );

      await expect(passwordResetService.findById('user-id')).resolves.toBe(
        passwordReset,
      );
    });

    it('anchors any error thrown through the callback to the current call-stack', async () => {
      const error = new Error();

      passwordResetModuleOptions.callback.retrievePasswordReset.mockImplementationOnce(
        () => {
          throw error;
        },
      );

      await expect(passwordResetService.findById('user-id')).rejects.toThrow(
        error,
      );
    });
  });

  describe(PasswordResetService.prototype.create.name, () => {
    it('calls the provided callback with the provided user & password-request', async () => {
      const user = Symbol('User');

      await passwordResetService.create(user);

      expect(
        passwordResetModuleOptions.callback.createPasswordReset,
      ).toHaveBeenCalledTimes(1);
      expect(
        passwordResetModuleOptions.callback.createPasswordReset,
      ).toHaveBeenCalledWith(user);
    });

    it('returns the result of the provided callback', async () => {
      const passwordReset = Symbol('Resolved password-reset');

      passwordResetModuleOptions.callback.createPasswordReset.mockResolvedValueOnce(
        passwordReset,
      );

      await expect(passwordResetService.create(Symbol('User'))).resolves.toBe(
        passwordReset,
      );
    });

    it('anchors any error thrown through the callback to the current call-stack', async () => {
      const error = new Error();

      passwordResetModuleOptions.callback.createPasswordReset.mockImplementationOnce(
        () => {
          throw error;
        },
      );

      await expect(passwordResetService.create(Symbol('User'))).rejects.toThrow(
        error,
      );
    });
  });

  describe(PasswordResetService.prototype.delete.name, () => {
    it('calls the provided callback with the provided password-reset id', async () => {
      const passwordResetId = 'password-reset-id';

      await passwordResetService.delete(passwordResetId);

      expect(
        passwordResetModuleOptions.callback.deletePasswordReset,
      ).toHaveBeenCalledTimes(1);
      expect(
        passwordResetModuleOptions.callback.deletePasswordReset,
      ).toHaveBeenCalledWith(passwordResetId);
    });

    it('anchors any error thrown through the callback to the current call-stack', async () => {
      const error = new Error();

      passwordResetModuleOptions.callback.deletePasswordReset.mockImplementationOnce(
        () => {
          throw error;
        },
      );

      await expect(
        passwordResetService.delete('password-reset-id'),
      ).rejects.toThrow(error);
    });
  });
});
