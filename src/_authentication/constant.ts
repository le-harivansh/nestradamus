/**
 * Note: The HTTP headers are automatically converted to lowercase on the
 *       server. We will therefore use **ONLY** lowercase characters in
 *       header names.
 */
export const enum JwtHttpHeader {
  USER_ACCESS_TOKEN = 'user.access-token',
  USER_REFRESH_TOKEN = 'user.refresh-token',
}
