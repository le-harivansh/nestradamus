import { Test, TestingModule } from '@nestjs/testing';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { UserCallbackService } from './user-callback.service';

describe(UserCallbackService.name, () => {
  const resolvedUser = Symbol('Resolved user');
  const userRetriever = jest.fn().mockResolvedValue(resolvedUser);
  const passwordValidator = jest.fn().mockResolvedValue(true);

  const authenticationModuleOptions = {
    callback: {
      user: {
        retrieve: userRetriever,
        validatePassword: passwordValidator,
      },
    },
  };

  let userCallbackService: UserCallbackService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
          useValue: authenticationModuleOptions,
        },
        UserCallbackService,
      ],
    }).compile();

    userCallbackService = module.get(UserCallbackService);
  });

  it('should be defined', () => {
    expect(userCallbackService).toBeDefined();
  });

  describe(UserCallbackService.prototype.retrieveUser.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls the configured callback with the passed-in `username`', async () => {
      const username = 'username';

      await userCallbackService.retrieveUser(username);

      expect(userRetriever).toHaveBeenCalledTimes(1);
      expect(userRetriever).toHaveBeenCalledWith(username);
    });

    it('returns the resolved authenticated-user', async () => {
      await expect(userCallbackService.retrieveUser('username')).resolves.toBe(
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
      await expect(
        userCallbackService.validatePassword({}, 'password'),
      ).resolves.toBe(true);
    });
  });
});
