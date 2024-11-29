import { SetMetadata } from '@nestjs/common';

import { REQUIRED_PERMISSIONS } from '../constant';
import { Permission, PermissionAndRequestParameterPair } from '../type';

/**
 * This function is used to set the required permissions on controllers or
 * request handlers.
 *
 * It will, however, (most of the time) be used in a type-safe decorator to
 * set the permissions on controllers or request handlers.
 *
 * e.g.:
 * ```
 * export function RequiresPermission(
 *  ...permissions: (
 *    | keyof ObjectWithOnlyValuesOfType<
 *        never,
 *        PermissionAndRequestParameterObject
 *      >
 *    | KeyValueTupleOf<
 *        ObjectWithoutValuesOfType<never, PermissionAndRequestParameterObject>
 *      >
 *  )[]
 * ): ReturnType<typeof setPermissions> {
 *  return setPermissions(permissions);
 * }
 *
 * type PermissionAndRequestParameterObject =
 *   PermissionAndRequestParameterObjectFrom<
 *     ReturnType<typeof createPermissionsMap>
 *   >;
 * ```
 */
export const setPermissions = (
  permissions: (Permission | PermissionAndRequestParameterPair)[],
) => SetMetadata(REQUIRED_PERMISSIONS, permissions);
