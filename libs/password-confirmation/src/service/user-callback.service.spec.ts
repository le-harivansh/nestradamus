import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';

import { PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN } from '../password-confirmation.module-definition';
import { UserCallbackService } from './user-callback.service';

describe(UserCallbackService.name, () => {
  const resolvedUser = Symbol('Resolved user');
  const userRetriever = jest.fn().mockResolvedValue(resolvedUser);
  const passwordValidator = jest.fn();

  const passwordConfirmationModuleOptions = {
    callback: {
      user: {
        retrieveFrom: userRetriever,
        validatePassword: passwordValidator,
      },
    },
  };

  let userCallbackService: UserCallbackService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN,
          useValue: passwordConfirmationModuleOptions,
        },
        UserCallbackService,
      ],
    }).compile();

    userCallbackService = module.get(UserCallbackService);
  });

  it('should be defined', () => {
    expect(userCallbackService).toBeDefined();
  });

  describe(UserCallbackService.prototype.retrieveFrom.name, () => {
    const request = {} as Request;

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls the configured callback with the current request', async () => {
      await userCallbackService.retrieveFrom(request);

      expect(userRetriever).toHaveBeenCalledTimes(1);
      expect(userRetriever).toHaveBeenCalledWith(request);
    });

    it('returns the resolved authenticated-user', async () => {
      await expect(userCallbackService.retrieveFrom(request)).resolves.toBe(
        resolvedUser,
      );
    });
  });

  describe(UserCallbackService.prototype.validatePassword.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls the configured callback with the passed-in `user` & `password`', async () => {
      const user = Symbol('Resolved user');
      const password = 'password';

      await userCallbackService.validatePassword(user, password);

      expect(passwordValidator).toHaveBeenCalledTimes(1);
      expect(passwordValidator).toHaveBeenCalledWith(user, password);
    });

    it('returns the value of the callback', async () => {
      const resolvedValue = true;

      passwordValidator.mockResolvedValueOnce(resolvedValue);
      await expect(
        userCallbackService.validatePassword({}, 'password'),
      ).resolves.toBe(resolvedValue);
    });
  });
});
