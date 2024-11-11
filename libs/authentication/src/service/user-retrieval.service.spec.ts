import { Test, TestingModule } from '@nestjs/testing';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { UserRetrievalService } from './user-retrieval.service';

describe(UserRetrievalService.name, () => {
  const resolvedUser = Symbol('Resolved user');
  const userRetriever = jest.fn().mockResolvedValue(resolvedUser);

  const authenticationModuleOptions: {
    callback: {
      retrieveUser: AuthenticationModuleOptions['callback']['retrieveUser'];
    };
  } = {
    callback: {
      retrieveUser: userRetriever,
    },
  };

  let userRetrievalService: UserRetrievalService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
          useValue: authenticationModuleOptions,
        },
        UserRetrievalService,
      ],
    }).compile();

    userRetrievalService = module.get(UserRetrievalService);
  });

  it('should be defined', () => {
    expect(userRetrievalService).toBeDefined();
  });

  describe(UserRetrievalService.prototype.retrieveUser.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls the configured callback with the passed-in `username`', async () => {
      const username = 'username';

      await userRetrievalService.retrieveUser(username);

      expect(userRetriever).toHaveBeenCalledTimes(1);
      expect(userRetriever).toHaveBeenCalledWith(username);
    });

    it('returns the resolved authenticated-user', async () => {
      await expect(userRetrievalService.retrieveUser('username')).resolves.toBe(
        resolvedUser,
      );
    });
  });
});
