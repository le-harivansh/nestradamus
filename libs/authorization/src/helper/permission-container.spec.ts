import { InternalServerErrorException } from '@nestjs/common';

import { PermissionsMap } from '../type';
import { PermissionContainer } from './permission-container';

describe(PermissionContainer.name, () => {
  const permissionStringSeparator = ':';

  const permissionsMap = {
    user: {
      create: () => true,
    },
  };

  let permissionsContainer: PermissionContainer;

  beforeAll(() => {
    permissionsContainer = new PermissionContainer(
      permissionsMap,
      permissionStringSeparator,
    );
  });

  it('should be defined', () => {
    expect(permissionsContainer).toBeDefined();
  });

  describe(PermissionContainer.prototype.getCallback.name, () => {
    it('returns the associated callback from the permissions-map', () => {
      const permission = `user${permissionStringSeparator}create`;

      expect(permissionsContainer.getCallback(permission)).toBe(
        permissionsMap.user.create,
      );
    });

    it.each([
      { permission: `user${permissionStringSeparator}update` },
      { permission: `foo${permissionStringSeparator}bar` },
    ])(
      `throws an '${InternalServerErrorException.name}' when a non-existant permission-path is provided ['$permission']`,
      ({ permission }) => {
        expect(() => permissionsContainer.getCallback(permission)).toThrow(
          InternalServerErrorException,
        );
      },
    );

    it(`throws an '${InternalServerErrorException.name}' if the resolved value is not a function`, () => {
      expect(() =>
        new PermissionContainer(
          { user: { update: true } } as unknown as PermissionsMap,
          permissionStringSeparator,
        ).getCallback(`user${permissionStringSeparator}update`),
      ).toThrow(InternalServerErrorException);
    });
  });

  describe(PermissionContainer.prototype.getPermissions.name, () => {
    const permissions = ['user:create'];

    let result: string[];

    beforeAll(() => {
      jest
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .spyOn(PermissionContainer as any, 'extractPermissionsFrom')
        .mockReturnValue(permissions);

      result = new PermissionContainer(
        { user: { create: () => true } },
        ':',
      ).getPermissions();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it(`calls ${PermissionContainer['extractPermissionsFrom'].name}`, () => {
      expect(PermissionContainer['extractPermissionsFrom']).toHaveBeenCalled();
    });

    it(`returns the result of ${PermissionContainer['extractPermissionsFrom'].name}`, () => {
      expect(result).toBe(permissions);
    });
  });

  describe(PermissionContainer['extractPermissionsFrom'].name, () => {
    it('extracts permissions from a single level', () => {
      const permissionsMap: PermissionsMap = {
        create: () => true,
      };

      expect(
        PermissionContainer['extractPermissionsFrom'](permissionsMap, ':'),
      ).toStrictEqual(['create']);
    });

    it('extracts permissions from multiple levels (homogeneous)', () => {
      const separator = ':';
      const permissionsMap: PermissionsMap = {
        user: {
          create: () => true,
          update: () => true,
          delete: () => true,
        },
      };

      expect(
        PermissionContainer['extractPermissionsFrom'](
          permissionsMap,
          separator,
        ),
      ).toStrictEqual([
        `user${separator}create`,
        `user${separator}update`,
        `user${separator}delete`,
      ]);
    });

    it('extracts permissions from multiple levels (heterogeneous)', () => {
      const separator = ':';
      const permissionsMap: PermissionsMap = {
        user: {
          create: () => true,
          update: {
            own: () => true,
            others: () => false,
          },
          delete: {
            own: () => true,
            others: () => false,
          },
        },
      };

      expect(
        PermissionContainer['extractPermissionsFrom'](
          permissionsMap,
          separator,
        ),
      ).toStrictEqual([
        `user${separator}create`,
        `user${separator}update${separator}own`,
        `user${separator}update${separator}others`,
        `user${separator}delete${separator}own`,
        `user${separator}delete${separator}others`,
      ]);
    });
  });
});
