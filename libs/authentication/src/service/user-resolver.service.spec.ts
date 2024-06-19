import { Test, TestingModule } from '@nestjs/testing';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { UserResolverService } from './user-resolver.service';

describe(UserResolverService.name, () => {
  const resolvedUser = Symbol('Resolved user');

  const resolveUserByUsername = jest.fn().mockResolvedValue(resolvedUser);
  const resolveUserById = jest.fn().mockResolvedValue(resolvedUser);

  const authenticationModuleOptions = {
    callbacks: {
      resolveUser: {
        byId: resolveUserById,
        byUsername: resolveUserByUsername,
      },
    },
  };

  let userResolverService: UserResolverService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
          useValue: authenticationModuleOptions,
        },
        UserResolverService,
      ],
    }).compile();

    userResolverService = module.get(UserResolverService);
  });

  it('should be defined', () => {
    expect(userResolverService).toBeDefined();
  });

  describe(UserResolverService.prototype.resolveByUsername.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls the resolved user resolver with the passed in username', async () => {
      const username = 'username-of-user-to-resolve';

      await userResolverService.resolveByUsername(username);

      expect(resolveUserByUsername).toHaveBeenCalledTimes(1);
      expect(resolveUserByUsername).toHaveBeenCalledWith(username);
    });

    it('returns the resolved user', async () => {
      await expect(
        userResolverService.resolveByUsername('username'),
      ).resolves.toBe(resolvedUser);
    });
  });

  describe(UserResolverService.prototype.resolveById.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls the resolved user resolver with the passed in user-id', async () => {
      const userId = 'user-id-of-user-to-resolve';

      await userResolverService.resolveById(userId);

      expect(resolveUserById).toHaveBeenCalledTimes(1);
      expect(resolveUserById).toHaveBeenCalledWith(userId);
    });

    it('returns the resolved user', async () => {
      await expect(
        userResolverService.resolveById('user-id'),
      ).resolves.toBe(resolvedUser);
    });
  });
});
