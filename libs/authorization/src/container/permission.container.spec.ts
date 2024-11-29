import { InternalServerErrorException } from '@nestjs/common';

import { PermissionsMap } from '../type';
import { PermissionContainer } from './permission.container';

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
});
