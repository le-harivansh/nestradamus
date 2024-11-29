import { z } from 'zod';

import { permissionCallbackValidator } from './authorization.module-options';

export type Permission = string;
export type RequestParameterMap = Record<string, string>;

export type PermissionAndRequestParameterPair = [
  Permission,
  RequestParameterMap,
];

export type PermissionCallback = z.infer<typeof permissionCallbackValidator>;

/**
 * This is the type of the map of permissions which is used to resolve the
 * callback for the associated permission.
 *
 * e.g.: ```
 * {
 *  user: {
 *    create: {
 *      own: () => true,
 *    },
 *  },
 * };
 * ```
 */
export type PermissionsMap = {
  [key: string]: PermissionsMap | PermissionCallback;
};

/**
 * This generic takes the type of a permission-map, and returns a new object
 * with the flattened keys, and the type of the first argument - if any - of
 * the associated permission callbacks.
 *
 * e.g.: Assume a permission-map with the shape:
 * ```
 * const permissionMap = {
 *  user: {
 *    create: () => true,
 *  },
 *  task: {
 *    delete: (user: User, requestParameterMap: { taskCreatorId: 'id' }) => requestParameterMap.taskCreatorId === user.id,
 *  }
 * };
 * ```
 *
 * `PermissionAndRequestParameterObjectFrom<typeof permissionMap, ':'>`
 * will yield the type:
 * ```
 * {
 *  'user:create': never,
 *  'task:delete': { taskCreatorId: string }
 * }
 * ```
 */
export type PermissionAndRequestParameterObjectFrom<
  T,
  Separator extends string,
> = ObjectFromPermissionAndRequestParameterPairs<
  CreatePermissionAndParameterObjectPairsFrom<T, '', Separator>
>;

type ObjectFromPermissionAndRequestParameterPairs<
  T extends [Permission, RequestParameterMap],
> = {
  [K in T as K[0]]: K[1];
};

/**
 * This generic takes the type of a permission-map, and returns a union of
 * pairs of the flattened keys with the associated (ultimate) values.
 *
 * e.g.: Assume a permission-map with the shape:
 * ```
 * const permissionMap = {
 *  user: {
 *    create: () => true,
 *  },
 *  task: {
 *    delete: (user: User, requestParameterMap: { taskCreatorId: 'id' }) => requestParameterMap.taskCreatorId === user.id,
 *  }
 * };
 * ```
 *
 * `CreatePermissionAndParameterObjectPairsFrom<typeof permissionMap, '', ':'>`
 * will yield the type: `['user:create', never] | ['task:delete', { taskCreatorId: string }]`
 */
type CreatePermissionAndParameterObjectPairsFrom<
  PermissionMap,
  Prefix extends string,
  Separator extends string,
> = {
  [Key in keyof PermissionMap]: PermissionMap[Key] extends PermissionCallback
    ? [
        Prefix extends ''
          ? Key & string
          : `${Prefix}${Separator}${Key & string}`,
        Parameters<PermissionMap[Key]>[1] extends undefined
          ? never
          : Parameters<PermissionMap[Key]>[1],
      ]
    : CreatePermissionAndParameterObjectPairsFrom<
        PermissionMap[Key],
        Prefix extends ''
          ? Key & string
          : `${Prefix}${Separator}${Key & string}`,
        Separator
      >;
}[keyof PermissionMap];

export type ObjectWithOnlyValuesOfType<IncludedType, Object> = {
  [Key in keyof Object as Object[Key] extends IncludedType
    ? Key
    : never]: Object[Key];
};

export type ObjectWithoutValuesOfType<ExcludedType, Object> = {
  [Key in keyof Object as Object[Key] extends ExcludedType
    ? never
    : Key]: Object[Key];
};

export type KeyValueTupleOf<Object, Key extends keyof Object = keyof Object> = [
  Key,
  Object[Key],
];
