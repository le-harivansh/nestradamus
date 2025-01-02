import {
  KeyValueTupleOf,
  ObjectWithOnlyValuesOfType,
  ObjectWithoutValuesOfType,
  PermissionAndRequestParameterObjectFrom,
  RecursiveConditionalObject,
  setPermissions,
} from '@library/authorization';

import { PERMISSION_STRING_SEPARATOR } from '../constant';
import { createPermissionsMap } from '../permission-map';

export function RequiresPermission(
  permissions: Permission | RecursiveConditionalObject<Permission>,
) {
  return setPermissions(permissions);
}

type Permission =
  | keyof ObjectWithOnlyValuesOfType<never, PermissionAndRequestParameterObject>
  | KeyValueTupleOf<
      ObjectWithoutValuesOfType<never, PermissionAndRequestParameterObject>
    >;

type PermissionAndRequestParameterObject =
  PermissionAndRequestParameterObjectFrom<
    ReturnType<typeof createPermissionsMap>,
    typeof PERMISSION_STRING_SEPARATOR
  >;
