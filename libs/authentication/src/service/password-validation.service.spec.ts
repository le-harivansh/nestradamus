import { Test, TestingModule } from '@nestjs/testing';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { PasswordValidationService } from './password-validation.service';

describe(PasswordValidationService.name, () => {
  const passwordValidator = jest.fn().mockResolvedValue(true);

  const authenticationModuleOptions: {
    callback: {
      validatePassword: AuthenticationModuleOptions['callback']['validatePassword'];
    };
  } = {
    callback: {
      validatePassword: passwordValidator,
    },
  };

  let passwordValidationService: PasswordValidationService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
          useValue: authenticationModuleOptions,
        },
        PasswordValidationService,
      ],
    }).compile();

    passwordValidationService = module.get(PasswordValidationService);
  });

  it('should be defined', () => {
    expect(passwordValidationService).toBeDefined();
  });

  describe(PasswordValidationService.prototype.validatePassword.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls the configured callback with the passed-in `user` & `password`', async () => {
      const user = Symbol('Resolved user');
      const password = 'password';

      await passwordValidationService.validatePassword(user, password);

      expect(passwordValidator).toHaveBeenCalledTimes(1);
      expect(passwordValidator).toHaveBeenCalledWith(user, password);
    });

    it('returns the value of the callback', async () => {
      await expect(
        passwordValidationService.validatePassword({}, 'password'),
      ).resolves.toBe(true);
    });
  });
});
