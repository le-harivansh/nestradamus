import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { ObjectId } from 'mongodb';

import { AUTHORIZATION_PERMISSIONS_CONTAINER } from '../constant';
import { PermissionContainer } from '../helper/permission-container';
import { UserCallbackService } from '../service/user-callback.service';
import {
  Permission,
  PermissionAndRequestParameterPair,
  PermissionConditionalObject,
} from '../type';
import { AuthorizationGuard } from './authorization.guard';

jest.mock('../service/user-callback.service');

describe(AuthorizationGuard.name, () => {
  const authenticatedUser = { _id: new ObjectId() };
  const request = { user: authenticatedUser };

  const reflector = { getAll: jest.fn() };

  const executionContext = {
    getClass: jest.fn(),
    getHandler: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;

  const permissionStringSeparator = ':';

  const permissionsMap = {
    user: {
      create: jest.fn().mockReturnValue(true),
      update: jest.fn().mockReturnValue(true),
      delete: jest.fn().mockReturnValue(true),
    },
  };

  let userCallbackService: jest.Mocked<UserCallbackService>;

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
        UserCallbackService,

        AuthorizationGuard,
      ],
    }).compile();

    userCallbackService = module.get(UserCallbackService);
    authorizationGuard = module.get(AuthorizationGuard);
  });

  it('should be defined', () => {
    expect(authorizationGuard).toBeDefined();
  });

  describe(AuthorizationGuard.prototype.canActivate.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it.each([
      { requiredPermissions: [] },
      { requiredPermissions: [undefined, undefined] },
    ])(
      'returns `true` if there are no required permissions for the specified route',
      async ({ requiredPermissions }) => {
        reflector.getAll.mockReturnValueOnce(requiredPermissions);

        await expect(
          authorizationGuard.canActivate(executionContext),
        ).resolves.toBe(true);
      },
    );

    it(`calls '${UserCallbackService.name}::${UserCallbackService.prototype.retrieveFrom.name}' with the current request`, async () => {
      reflector.getAll.mockReturnValueOnce(['user:read:own']);
      jest
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .spyOn(authorizationGuard as any, 'isAllowed')
        .mockResolvedValueOnce(true);

      await authorizationGuard.canActivate(executionContext);

      expect(userCallbackService.retrieveFrom).toHaveBeenCalledTimes(1);
      expect(userCallbackService.retrieveFrom).toHaveBeenCalledWith(request);
    });

    it(`calls '${UserCallbackService.name}::${UserCallbackService.prototype.getPermissionsFor.name}' with the currently authenticated user`, async () => {
      reflector.getAll.mockReturnValueOnce(['user:read:own']);
      userCallbackService.retrieveFrom.mockResolvedValueOnce(authenticatedUser);
      jest
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .spyOn(authorizationGuard as any, 'isAllowed')
        .mockResolvedValueOnce(true);

      await authorizationGuard.canActivate(executionContext);

      expect(userCallbackService.getPermissionsFor).toHaveBeenCalledTimes(1);
      expect(userCallbackService.getPermissionsFor).toHaveBeenCalledWith(
        authenticatedUser,
      );
    });

    it('returns `true` if ALL the permission results resolve to `true`', async () => {
      reflector.getAll.mockReturnValueOnce([
        'user:read:own',
        'user:read:others',
        'user:list',
      ]);
      jest
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .spyOn(authorizationGuard as any, 'isAllowed')
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      await expect(
        authorizationGuard.canActivate(executionContext),
      ).resolves.toBe(true);
    });

    it('returns `false` if ANY one result of resolves to `false`', async () => {
      reflector.getAll.mockReturnValueOnce([
        'user:read:own',
        'user:read:others',
        'user:list',
      ]);
      jest
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .spyOn(authorizationGuard as any, 'isAllowed')
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      await expect(
        authorizationGuard.canActivate(executionContext),
      ).resolves.toBe(false);
    });
  });

  describe(AuthorizationGuard.prototype['isAllowed'].name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('returns `false` if the specified permission is not included in the resolved user permissions', async () => {
      await expect(
        authorizationGuard['isAllowed']('user:create', undefined, [], {}),
      ).resolves.toBe(false);
    });

    it('calls the resolved callback with the authenticated user and the callback parameters', async () => {
      const callbackParameters = { userId: new ObjectId().toString() };
      jest
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .spyOn(AuthorizationGuard as any, 'buildCallbackParameterObject')
        .mockReturnValueOnce(callbackParameters);

      await authorizationGuard['isAllowed'](
        'user:update',
        authenticatedUser,
        ['user:update'],
        {},
      );

      expect(permissionsMap.user.update).toHaveBeenCalledTimes(1);
      expect(permissionsMap.user.update).toHaveBeenCalledWith(
        authenticatedUser,
        callbackParameters,
      );
    });

    it.each<{ canUpdate: boolean }>([
      { canUpdate: true },
      { canUpdate: false },
    ])(
      'returns the result of calling the resolved callback',
      async ({ canUpdate }) => {
        permissionsMap.user.update.mockResolvedValueOnce(canUpdate);

        await expect(
          authorizationGuard['isAllowed'](
            'user:update',
            authenticatedUser,
            ['user:update'],
            {},
          ),
        ).resolves.toBe(canUpdate);
      },
    );

    it('recursively calls itself depending on the depth of the passed-in conditional object', async () => {
      const isAllowedSpy = jest.spyOn(authorizationGuard as never, 'isAllowed');

      const permission: PermissionConditionalObject = {
        and: [
          'user:create',
          {
            or: ['user:show', 'user:list'],
          },
        ],
      };

      await authorizationGuard['isAllowed'](
        permission,
        authenticatedUser,
        [],
        {},
      );

      expect(isAllowedSpy).toHaveBeenCalledTimes(5);

      expect(isAllowedSpy).toHaveBeenNthCalledWith(
        1,
        permission,
        authenticatedUser,
        [],
        {},
      );
      expect(isAllowedSpy).toHaveBeenNthCalledWith(
        2,
        permission['and'][0],
        authenticatedUser,
        [],
        {},
      );
      expect(isAllowedSpy).toHaveBeenNthCalledWith(
        3,
        permission['and'][1],
        authenticatedUser,
        [],
        {},
      );
      expect(isAllowedSpy).toHaveBeenNthCalledWith(
        4,
        (permission['and'][1] as { or: string[] })['or'][0],
        authenticatedUser,
        [],
        {},
      );
      expect(isAllowedSpy).toHaveBeenNthCalledWith(
        5,
        (permission['and'][1] as { or: string[] })['or'][1],
        authenticatedUser,
        [],
        {},
      );
    });

    describe('- and', () => {
      it('returns `true` if ALL of the recursive instances resolve to `true`', async () => {
        permissionsMap.user.create.mockResolvedValueOnce(true);
        permissionsMap.user.update.mockResolvedValueOnce(true);
        permissionsMap.user.delete.mockResolvedValueOnce(true);

        await expect(
          authorizationGuard['isAllowed'](
            { and: ['user:create', { and: ['user:update', 'user:delete'] }] },
            authenticatedUser,
            ['user:create', 'user:update', 'user:delete'],
            {},
          ),
        ).resolves.toBe(true);
      });

      it('returns `false` if ANY of the recursive instances resolves to `false`', async () => {
        permissionsMap.user.create.mockResolvedValueOnce(false);
        permissionsMap.user.update.mockResolvedValueOnce(true);
        permissionsMap.user.delete.mockResolvedValueOnce(true);

        await expect(
          authorizationGuard['isAllowed'](
            { and: ['user:create', { and: ['user:update', 'user:delete'] }] },
            authenticatedUser,
            ['user:create', 'user:update', 'user:delete'],
            {},
          ),
        ).resolves.toBe(false);
      });
    });

    describe('- or', () => {
      it('returns `true` if ANY one of the recursive instances resolves to `true`', async () => {
        permissionsMap.user.create.mockResolvedValueOnce(false);
        permissionsMap.user.update.mockResolvedValueOnce(true);
        permissionsMap.user.delete.mockResolvedValueOnce(false);

        await expect(
          authorizationGuard['isAllowed'](
            { or: ['user:create', { or: ['user:update', 'user:delete'] }] },
            authenticatedUser,
            ['user:create', 'user:update', 'user:delete'],
            {},
          ),
        ).resolves.toBe(true);
      });

      it('returns `false` if ALL one of the recursive instances resolve to `false`', async () => {
        permissionsMap.user.create.mockResolvedValueOnce(false);
        permissionsMap.user.update.mockResolvedValueOnce(false);
        permissionsMap.user.delete.mockResolvedValueOnce(false);

        await expect(
          authorizationGuard['isAllowed'](
            { or: ['user:create', { or: ['user:update', 'user:delete'] }] },
            authenticatedUser,
            ['user:create', 'user:update', 'user:delete'],
            {},
          ),
        ).resolves.toBe(false);
      });
    });
  });

  describe(AuthorizationGuard['buildCallbackParameterObject'].name, () => {
    const requestParameters: Request['params'] = {
      id: new ObjectId().toString(),
    };

    it('returns the map of the parameter object values to the request-parameter keys', () => {
      expect(
        AuthorizationGuard['buildCallbackParameterObject'](requestParameters, {
          userId: 'id',
        }),
      ).toStrictEqual({
        userId: requestParameters['id'],
      });
    });

    it(`throws '${NotFoundException.name}' if the specified key in the parameter object is not found in the request's parameter keys`, () => {
      expect(() =>
        AuthorizationGuard['buildCallbackParameterObject'](requestParameters, {
          userEmail: 'email',
        }),
      ).toThrow(NotFoundException);
    });
  });

  describe(AuthorizationGuard['permissionIsString'].name, () => {
    it('returns `true` if the permission is a string', () => {
      expect(AuthorizationGuard['permissionIsString']('user:read')).toBe(true);
    });

    it('returns `false` if the permission is NOT a string', () => {
      expect(
        AuthorizationGuard['permissionIsString']([
          'user:update:others',
          { userId: 'id' },
        ]),
      ).toBe(false);
    });
  });

  describe(
    AuthorizationGuard['permissionIsStringAndRequestParameterPair'].name,
    () => {
      it('returns `true` if the permission is a pair consisting of a string permission & request-parameter object', () => {
        expect(
          AuthorizationGuard['permissionIsStringAndRequestParameterPair']([
            'user:update:others',
            { userId: 'id' },
          ]),
        ).toBe(true);
      });

      it.each([
        'user:read' as Permission,
        { and: ['user:create', 'user:list'] } as PermissionConditionalObject,
        [
          'user:update',
          { userId: 'id' },
          '',
        ] as unknown as PermissionAndRequestParameterPair,
        [{}, { userId: 'id' }] as unknown as PermissionAndRequestParameterPair,
        ['user:update', ''] as unknown as PermissionAndRequestParameterPair,
        ['user:update', null] as unknown as PermissionAndRequestParameterPair,
      ])(
        'returns `false` if the permission is NOT a pair consisting of a string permission & request-parameter object',
        (permission) => {
          expect(
            AuthorizationGuard['permissionIsStringAndRequestParameterPair'](
              permission,
            ),
          ).toBe(false);
        },
      );
    },
  );

  describe(AuthorizationGuard['permissionIsConditionalObject'].name, () => {
    it.each<PermissionConditionalObject>([
      { and: ['user:create', 'user:list'] },
      { or: ['user:create', 'user:list'] },
      {
        and: [
          'user:create',
          'user:list',
          { or: ['user:create', 'user:delete'] },
        ],
      },
    ])(
      'returns `true` if the permission is a permission conditional object',
      (permission) => {
        expect(
          AuthorizationGuard['permissionIsConditionalObject'](permission),
        ).toBe(true);
      },
    );

    it.each([
      'user:read' as Permission,
      [
        'user:update',
        { userId: 'id' },
      ] as unknown as PermissionAndRequestParameterPair,
      null as unknown as PermissionConditionalObject,
      {
        INVALID: ['user:create', 'user:list'],
      } as unknown as PermissionConditionalObject,
    ])(
      'returns `false` if the permission is NOT a permission conditional object',
      (permission) => {
        expect(
          AuthorizationGuard['permissionIsConditionalObject'](permission),
        ).toBe(false);
      },
    );
  });
});
