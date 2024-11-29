/**
 * The DI key to retrieve the instance of the `PermissionContainer`.
 */
export const AUTHORIZATION_PERMISSIONS_CONTAINER = Symbol(
  'Authorization Permissions Container',
);

/**
 * The DI key used by the authorization decorator & guard to set & retrieve the
 * permissions required by the specified route.
 */
export const REQUIRED_PERMISSIONS = Symbol('Required permissions');
