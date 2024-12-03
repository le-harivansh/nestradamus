import {
  KeyValueTupleOf,
  ObjectWithOnlyValuesOfType,
  ObjectWithoutValuesOfType,
  PermissionAndRequestParameterObjectFrom,
  setPermissions,
} from '@library/authorization';

import { PERMISSION_STRING_SEPARATOR } from '../constant';
import { createPermissionsMap } from '../permission-map';

export function RequiresPermission(
  ...permissions: (
    | keyof ObjectWithOnlyValuesOfType<
        never,
        PermissionAndRequestParameterObject
      >
    | KeyValueTupleOf<
        ObjectWithoutValuesOfType<never, PermissionAndRequestParameterObject>
      >
  )[]
): ReturnType<typeof setPermissions> {
  return setPermissions(permissions);
}

type PermissionAndRequestParameterObject =
  PermissionAndRequestParameterObjectFrom<
    ReturnType<typeof createPermissionsMap>,
    typeof PERMISSION_STRING_SEPARATOR
  >;
