import { InternalServerErrorException } from '@nestjs/common';

import { Permission, PermissionCallback, PermissionsMap } from '../type';

export class PermissionContainer {
  constructor(
    private readonly permissionsMap: PermissionsMap,
    private readonly permissionStringSeparator: string,
  ) {}

  getCallback(permission: Permission): PermissionCallback {
    const permissionsMapKeys = permission.split(this.permissionStringSeparator);

    let item: PermissionsMap | PermissionCallback = this.permissionsMap;

    for (const key of permissionsMapKeys) {
      const innerItem = item[key] as PermissionsMap;

      if (innerItem === undefined) {
        throw new InternalServerErrorException(
          `'${key}' resolves to undefined when retrieving callback for '${permission}'.`,
        );
      }

      item = innerItem;
    }

    if (!PermissionContainer.isFunction(item)) {
      throw new InternalServerErrorException(
        `'${permission}' does not resolve to a function.`,
      );
    }

    return item as PermissionCallback;
  }

  private static isFunction(
    value: unknown,
  ): value is (...args: unknown[]) => unknown {
    return typeof value === 'function';
  }
}
