import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AUTHORIZATION_MODULE_OPTIONS_TOKEN } from '../authorization.module-definition';
import { AuthorizationModuleOptions } from '../authorization.module-options';
import { UserService } from './user.service';

describe(UserService.name, () => {
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

  let userService: UserService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AUTHORIZATION_MODULE_OPTIONS_TOKEN,
          useValue: authorizationModuleOptions,
        },
        UserService,
      ],
    }).compile();

    userService = module.get(UserService);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe(UserService.prototype.retrieveFrom.name, () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("calls the configured 'user.retrieveFromRequest' callback with the passed-in request", () => {
      retrieveUserFromRequestCallback.mockResolvedValueOnce({});

      const request = Symbol('request');

      userService.retrieveFrom(request);

      expect(retrieveUserFromRequestCallback).toHaveBeenCalledTimes(1);
      expect(retrieveUserFromRequestCallback).toHaveBeenCalledWith(request);
    });

    it("returns the result of the 'user.retrieveFromRequest' callback", async () => {
      const user = Symbol('user');

      retrieveUserFromRequestCallback.mockResolvedValueOnce(user);

      await expect(userService.retrieveFrom({})).resolves.toBe(user);
    });

    it(`throws an '${UnauthorizedException.name}' if a user was not found on the request`, async () => {
      retrieveUserFromRequestCallback.mockResolvedValueOnce(undefined);

      await expect(() => userService.retrieveFrom({})).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe(UserService.prototype.getPermissionsFor.name, () => {
    const user = Symbol('user');
    const permissions = [
      `user${authorizationModuleOptions.permissionStringSeparator}create`,
    ];

    let result: unknown;

    beforeAll(async () => {
      getPermissionsFromUserCallback.mockResolvedValueOnce(permissions);

      result = await userService.getPermissionsFor(user);
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
