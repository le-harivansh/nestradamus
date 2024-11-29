import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';

import { AUTHORIZATION_PERMISSIONS_CONTAINER } from '../constant';
import { PermissionContainer } from '../container/permission.container';
import { UserService } from '../service/user.service';
import { AuthorizationGuard } from './authorization.guard';

jest.mock('../service/user.service');

describe(AuthorizationGuard.name, () => {
  const request = {
    params: {
      id: '1234',
      email: 'user@email.dev',
    },
  } as unknown as Request;

  const reflector = {
    getAllAndMerge: jest.fn(),
  };

  const executionContext = {
    getClass: () => undefined,
    getHandler: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  const permissionStringSeparator = ':';

  const permissionsMap = {
    user: {
      create: jest.fn().mockReturnValue(true),
      update: jest.fn().mockReturnValue(true),
      delete: jest.fn().mockReturnValue(true),
    },
  };

  const buildCallbackParameterObjectFrom = jest.spyOn(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    AuthorizationGuard as any,
    'buildCallbackParameterObjectFrom',
  );

  let userService: jest.Mocked<UserService>;

  let authorizationGuard: AuthorizationGuard;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: Reflector,
          useValue: reflector,
        },
        {
          provide: AUTHORIZATION_PERMISSIONS_CONTAINER,
          useValue: new PermissionContainer(
            permissionsMap,
            permissionStringSeparator,
          ),
        },
        UserService,

        AuthorizationGuard,
      ],
    }).compile();

    userService = module.get(UserService);
    authorizationGuard = module.get(AuthorizationGuard);
  });

  it('should be defined', () => {
    expect(authorizationGuard).toBeDefined();
  });

  describe(AuthorizationGuard.prototype.canActivate.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('returns `true` if no permissions are retrieved from the class or handler', async () => {
      reflector.getAllAndMerge.mockReturnValueOnce([]); // sets the required permission(s)

      await expect(
        authorizationGuard.canActivate(executionContext),
      ).resolves.toBe(true);
    });

    it(`calls '${UserService.name}::${UserService.prototype.retrieveFrom.name}' with the current request`, async () => {
      reflector.getAllAndMerge.mockReturnValueOnce([
        `user${permissionStringSeparator}create`,
      ]); // sets the required permission(s)
      userService.retrieveFrom.mockImplementationOnce(() => {
        throw Error('Could not retrieve user.');
      });

      try {
        await authorizationGuard.canActivate(executionContext);
      } catch {
        // do nothing...
      }

      expect(userService.retrieveFrom).toHaveBeenCalledTimes(1);
      expect(userService.retrieveFrom).toHaveBeenCalledWith(request);
    });

    it(`calls '${UserService.name}::${UserService.prototype.getPermissionsFor.name}' with the resolved user`, async () => {
      const user = Symbol('User');

      reflector.getAllAndMerge.mockReturnValueOnce([
        `user${permissionStringSeparator}create`,
      ]); // sets the required permission(s)
      userService.retrieveFrom.mockResolvedValueOnce(user);
      userService.getPermissionsFor.mockResolvedValueOnce([]);

      await authorizationGuard.canActivate(executionContext);

      expect(userService.getPermissionsFor).toHaveBeenCalledTimes(1);
      expect(userService.getPermissionsFor).toHaveBeenCalledWith(user);
    });

    it('returns `false` if the specified permission is not found on the authenticated user', async () => {
      const user = Symbol('User');

      reflector.getAllAndMerge.mockReturnValueOnce([
        `user${permissionStringSeparator}create`,
      ]); // sets the required permission(s)
      userService.retrieveFrom.mockResolvedValueOnce(user);
      userService.getPermissionsFor.mockResolvedValueOnce([]);

      await expect(
        authorizationGuard.canActivate(executionContext),
      ).resolves.toBe(false);
    });

    it('calls the resolved callback with the resolved authenticated user and the callback parameter-map', async () => {
      const user = Symbol('User');
      const userPermissions = [`user${permissionStringSeparator}update`];
      const requiredPermissions = [
        [`user${permissionStringSeparator}update`, { userId: 'id' }],
      ];
      const resolvedCallbackParameters = { userId: request.params['id'] };

      buildCallbackParameterObjectFrom.mockReturnValueOnce(
        resolvedCallbackParameters,
      );
      reflector.getAllAndMerge.mockReturnValueOnce(requiredPermissions); // sets the required permission(s)
      userService.retrieveFrom.mockResolvedValueOnce(user);
      userService.getPermissionsFor.mockResolvedValueOnce(userPermissions);

      await authorizationGuard.canActivate(executionContext);

      expect(permissionsMap.user.update).toHaveBeenCalledTimes(1);
      expect(permissionsMap.user.update).toHaveBeenCalledWith(
        user,
        expect.any(Object),
      );
    });

    it('returns `false` if any one callback returns `false`', async () => {
      const userPermissions = [
        `user${permissionStringSeparator}create`,
        `user${permissionStringSeparator}update`,
        `user${permissionStringSeparator}delete`,
      ];
      const requiredPermissions = [
        `user${permissionStringSeparator}create`,
        [`user${permissionStringSeparator}update`, { userId: 'id' }],
        [`user${permissionStringSeparator}delete`, { userId: 'id' }],
      ];

      reflector.getAllAndMerge.mockReturnValueOnce(requiredPermissions); // sets the required permission(s)
      userService.getPermissionsFor.mockResolvedValueOnce(userPermissions);

      permissionsMap.user.update.mockReturnValueOnce(false);

      await expect(
        authorizationGuard.canActivate(executionContext),
      ).resolves.toBe(false);
    });

    it('returns `true` if all the callbacks return `true`', async () => {
      const userPermissions = [
        `user${permissionStringSeparator}create`,
        `user${permissionStringSeparator}update`,
        `user${permissionStringSeparator}delete`,
      ];
      const requiredPermissions = [
        [`user${permissionStringSeparator}create`, { userId: 'id' }],
        [`user${permissionStringSeparator}update`, { userId: 'id' }],
        [`user${permissionStringSeparator}delete`, { userId: 'id' }],
      ];

      reflector.getAllAndMerge.mockReturnValueOnce(requiredPermissions); // sets the required permission(s)
      userService.getPermissionsFor.mockResolvedValueOnce(userPermissions);

      await expect(
        authorizationGuard.canActivate(executionContext),
      ).resolves.toBe(true);
    });
  });

  describe(AuthorizationGuard['buildCallbackParameterObjectFrom'].name, () => {
    it('returns the map of the parameter object values to the request parameter keys', () => {
      expect(
        AuthorizationGuard['buildCallbackParameterObjectFrom'](request, {
          cId: 'id',
          userEmail: 'email',
        }),
      ).toStrictEqual({
        cId: request.params['id'],
        userEmail: request.params['email'],
      });
    });

    it(`throws '${NotFoundException.name}' if the specified key in the parameter object is not found in the request's parameter keys`, () => {
      expect(() =>
        AuthorizationGuard['buildCallbackParameterObjectFrom'](request, {
          xId: 'wrongRequestParamKey',
          userEmail: 'email',
        }),
      ).toThrow(NotFoundException);
    });
  });
});
