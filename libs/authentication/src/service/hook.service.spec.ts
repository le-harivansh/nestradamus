import { Test, TestingModule } from '@nestjs/testing';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { HookService } from './hook.service';

describe(HookService.name, () => {
  const request = Symbol('Request');
  const response = Symbol('Response');
  const authenticatedUser = Symbol('Authenticated User');

  const postLoginHook = jest.fn();
  const postLogoutHook = jest.fn();

  const authenticationModuleOptions = {
    hook: {
      post: {
        login: postLoginHook,
        logout: postLogoutHook,
      },
    },
  };

  let hookService: HookService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
          useValue: authenticationModuleOptions,
        },

        HookService,
      ],
    }).compile();

    hookService = module.get(HookService);
  });

  it('should be defined', () => {
    expect(hookService).toBeDefined();
  });

  describe(HookService.prototype.postLogin.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls the configured callback with the passed-in request, response, & authenticated-user objects', async () => {
      await hookService.postLogin(request, response, authenticatedUser);

      expect(postLoginHook).toHaveBeenCalledTimes(1);
      expect(postLoginHook).toHaveBeenCalledWith(
        request,
        response,
        authenticatedUser,
      );
    });
  });

  describe(HookService.prototype.postLogout.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls the configured callback with the passed-in request, response, & authenticated-user objects', async () => {
      await hookService.postLogout(request, response, authenticatedUser);

      expect(postLogoutHook).toHaveBeenCalledTimes(1);
      expect(postLogoutHook).toHaveBeenCalledWith(
        request,
        response,
        authenticatedUser,
      );
    });
  });
});
