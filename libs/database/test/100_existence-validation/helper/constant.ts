export const TEST_COLLECTION_NAME = 'test-collection';

export const ROUTES = {
  USERNAME: {
    BASE: 'username',

    IMPLICIT_SHOULD_EXIST: 'implicit-should-exist',
    EXPLICIT_SHOULD_EXIST: 'explicit-should-exist',

    IMPLICIT_SHOULD_NOT_EXIST: 'implicit-should-not-exist',
    EXPLICIT_SHOULD_NOT_EXIST: 'explicit-should-not-exist',
  },

  ID: {
    BASE: 'id',

    IMPLICIT_SHOULD_EXIST: 'implicit-should-exist',
    EXPLICIT_SHOULD_EXIST: 'explicit-should-exist',

    IMPLICIT_SHOULD_NOT_EXIST: 'implicit-should-not-exist',
    EXPLICIT_SHOULD_NOT_EXIST: 'explicit-should-not-exist',
  },
} as const;
