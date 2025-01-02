import {
  KeyValueTupleOf,
  ObjectWithOnlyValuesOfType,
  ObjectWithoutValuesOfType,
  PermissionAndRequestParameterObjectFrom,
  RecursiveConditionalObject,
  setPermissions,
} from '@library/authorization';

import { PERMISSION_STRING_SEPARATOR } from './constant';
import { permissionsMap } from './permissions-map';

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
    typeof permissionsMap,
    typeof PERMISSION_STRING_SEPARATOR
  >;
