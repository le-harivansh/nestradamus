/**
 * The string pattern used by 'ms' to define durations.
 */
export const MS_DURATION_PATTERN =
  /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i;

export const enum JwtType {
  ACCESS_TOKEN = 'access-token',
  REFRESH_TOKEN = 'refresh-token',
}

export const enum Guard {
  LOCAL = 'local',
  ACCESS_TOKEN = 'access-token',
  REFRESH_TOKEN = 'refresh-token',
}

/**
 * Note: The HTTP headers are automatically converted to lowercase on the
 *       server. It is therefore recommended to use lowercase characters in
 *       Header names.
 */
export const enum TokenHttpHeader {
  ACCESS_TOKEN = 'access-token',
  REFRESH_TOKEN = 'refresh-token',
}
