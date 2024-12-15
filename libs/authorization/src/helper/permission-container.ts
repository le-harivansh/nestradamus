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

  getPermissions(): string[] {
    return PermissionContainer.extractPermissionsFrom(
      this.permissionsMap,
      this.permissionStringSeparator,
    );
  }

  private static extractPermissionsFrom(
    permissionsMap: PermissionsMap,
    permissionStringSeparator: string,
    currentPermissionPrefix: string = '',
  ): string[] {
    const permissions: string[] = [];

    for (const [key, value] of Object.entries(permissionsMap)) {
      const permissionOrPrefix = `${currentPermissionPrefix === '' ? '' : `${currentPermissionPrefix}${permissionStringSeparator}`}${key}`;

      if (typeof value === 'function') {
        permissions.push(permissionOrPrefix);
      }

      permissions.push(
        ...PermissionContainer.extractPermissionsFrom(
          value as PermissionsMap,
          permissionStringSeparator,
          permissionOrPrefix,
        ),
      );
    }

    return permissions;
  }

  private static isFunction(
    value: unknown,
  ): value is (...args: unknown[]) => unknown {
    return typeof value === 'function';
  }
}
