/**
 * This module contains the different event types that are used across the
 * application. Each 'context' should export a different enum; i.e.: `User`
 * events should be exported in a different enum than `Administrator` events.
 */

export const Event = {
  User: {
    REGISTERED: Symbol('user:registered'),
    PASSWORD_RESET: Symbol('user:password-reset'),
  } as const,
} as const;
