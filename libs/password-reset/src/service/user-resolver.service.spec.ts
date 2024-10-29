import { Test, TestingModule } from '@nestjs/testing';

import { PASSWORD_RESET_MODULE_OPTIONS_TOKEN } from '../password-reset.module-definition';
import { UserResolverService } from './user-resolver.service';

describe(UserResolverService.name, () => {
  const passwordResetModuleOptions = {
    callback: {
      resolveUser: jest.fn(),
    },
  } as const;

  let userResolverService: UserResolverService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PASSWORD_RESET_MODULE_OPTIONS_TOKEN,
          useValue: passwordResetModuleOptions,
        },
        UserResolverService,
      ],
    }).compile();

    userResolverService = module.get(UserResolverService);
  });

  it('should be defined', () => {
    expect(userResolverService).toBeDefined();
  });

  describe(UserResolverService.prototype.resolveUser.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls the provided callback with the provided username', async () => {
      const username = 'user@email.dev';

      await userResolverService.resolveUser(username);

      expect(
        passwordResetModuleOptions.callback.resolveUser,
      ).toHaveBeenCalledTimes(1);
      expect(
        passwordResetModuleOptions.callback.resolveUser,
      ).toHaveBeenCalledWith(username);
    });

    it('returns the result of the provided callback', async () => {
      const user = Symbol('Resolved user');

      passwordResetModuleOptions.callback.resolveUser.mockResolvedValueOnce(
        user,
      );

      await expect(userResolverService.resolveUser('username')).resolves.toBe(
        user,
      );
    });

    it('anchors any error thrown through the callback to the current call-stack', async () => {
      const error = new Error();

      passwordResetModuleOptions.callback.resolveUser.mockImplementationOnce(
        () => {
          throw error;
        },
      );

      await expect(userResolverService.resolveUser('username')).rejects.toThrow(
        error,
      );
    });
  });
});
