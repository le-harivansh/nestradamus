import { ExecutionContext, InternalServerErrorException } from '@nestjs/common';

import { getAuthenticatedUserFromPropertyInRequest } from './authenticated-user.decorator-factory';

describe(getAuthenticatedUserFromPropertyInRequest.name, () => {
  const REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER = 'user';
  const createExecutionContextWithAuthenticatedUser = (user: unknown) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          [REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER]: user,
        }),
      }),
    }) as ExecutionContext;

  const getAuthenticatedUser = getAuthenticatedUserFromPropertyInRequest(
    REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER,
  );

  it(`returns the user object stored in the '${REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER}' property of the 'request' object`, () => {
    const authenticatedUser = Symbol('Authenticated user');
    const ctx = createExecutionContextWithAuthenticatedUser(authenticatedUser);

    expect(getAuthenticatedUser(undefined, ctx)).toBe(authenticatedUser);
  });

  it('returns the property from the user object, if one is passed as an argument', () => {
    const authenticatedUser = { name: Symbol('User name') };
    const ctx = createExecutionContextWithAuthenticatedUser(authenticatedUser);

    expect(getAuthenticatedUser('name', ctx)).toBe(authenticatedUser.name);
  });

  it(`throws an '${InternalServerErrorException.name}' if the '${REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER}' property of the 'request' object is 'undefined'`, () => {
    const ctx = createExecutionContextWithAuthenticatedUser(undefined);

    expect(() => getAuthenticatedUser(undefined, ctx)).toThrow(
      InternalServerErrorException,
    );
  });
});
