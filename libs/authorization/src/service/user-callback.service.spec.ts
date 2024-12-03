import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AUTHORIZATION_MODULE_OPTIONS_TOKEN } from '../authorization.module-definition';
import { AuthorizationModuleOptions } from '../authorization.module-options';
import { UserCallbackService } from './user-callback.service';

describe(UserCallbackService.name, () => {
  const retrieveUserFromRequestCallback = jest.fn();
  const getPermissionsFromUserCallback = jest.fn();

  const authorizationModuleOptions: Omit<
    AuthorizationModuleOptions,
    'permissionsMap'
  > = {
    permissionStringSeparator: ':',

    user: {
      retrieveFromRequest: retrieveUserFromRequestCallback,
      getPermissions: getPermissionsFromUserCallback,
    },
  };

  let userCallbackService: UserCallbackService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AUTHORIZATION_MODULE_OPTIONS_TOKEN,
          useValue: authorizationModuleOptions,
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
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("calls the configured 'user.retrieveFromRequest' callback with the passed-in request", () => {
      retrieveUserFromRequestCallback.mockResolvedValueOnce({});

      const request = Symbol('request');

      userCallbackService.retrieveFrom(request);

      expect(retrieveUserFromRequestCallback).toHaveBeenCalledTimes(1);
      expect(retrieveUserFromRequestCallback).toHaveBeenCalledWith(request);
    });

    it("returns the result of the 'user.retrieveFromRequest' callback", async () => {
      const user = Symbol('user');

      retrieveUserFromRequestCallback.mockResolvedValueOnce(user);

      await expect(userCallbackService.retrieveFrom({})).resolves.toBe(user);
    });

    it(`throws an '${UnauthorizedException.name}' if a user was not found on the request`, async () => {
      retrieveUserFromRequestCallback.mockResolvedValueOnce(undefined);

      await expect(() => userCallbackService.retrieveFrom({})).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe(UserCallbackService.prototype.getPermissionsFor.name, () => {
    const user = Symbol('user');
    const permissions = [
      `user${authorizationModuleOptions.permissionStringSeparator}create`,
    ];

    let result: unknown;

    beforeAll(async () => {
      getPermissionsFromUserCallback.mockResolvedValueOnce(permissions);

      result = await userCallbackService.getPermissionsFor(user);
    });

    it("calls the configured 'user.getPermissions' with the passed-in user", () => {
      expect(getPermissionsFromUserCallback).toHaveBeenCalledTimes(1);
      expect(getPermissionsFromUserCallback).toHaveBeenCalledWith(user);
    });

    it("returns the result of the 'user.getPermissions' callback", () => {
      expect(result).toBe(permissions);
    });
  });
});
