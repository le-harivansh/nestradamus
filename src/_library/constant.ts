/**
 * The string pattern used by 'ms' to define durations.
 */
export const MS_DURATION_PATTERN =
  /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i;

export const enum ExistenceConstraint {
  SHOULD_EXIST = 'document-with-matching-property-should-exist',
  SHOULD_NOT_EXIST = 'document-with-matching-property-should-not-exist',
}
