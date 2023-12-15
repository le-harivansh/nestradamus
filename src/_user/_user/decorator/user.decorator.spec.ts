import {
  ExecutionContext,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import { newDocument } from '@/_library/helper';

import { User, UserDocument, UserSchema } from '../schema/user.schema';
import { getUserFromRequest } from './user.decorator';

describe(getUserFromRequest.name, () => {
  const mockExecutionContext = (user?: UserDocument) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  const user = newDocument<User>(User, UserSchema, {
    email: 'user@email.com',
    password: 'P@ssw0rd',
  });

  it('returns the user object attached to the request object', () => {
    expect(getUserFromRequest(undefined, mockExecutionContext(user))).toBe(
      user,
    );
  });

  it("returns the value of the specified property from the user's object", () => {
    expect(getUserFromRequest('email', mockExecutionContext(user))).toBe(
      user.email,
    );
  });

  it('throws an `UnauthorizedException` if the request has no user object', () => {
    expect(() => getUserFromRequest(undefined, mockExecutionContext())).toThrow(
      UnauthorizedException,
    );
  });

  it('throws an `InternalServerErrorException` if the queried property does not exist on the user object', () => {
    expect(() =>
      getUserFromRequest(
        'nope' as unknown as Parameters<typeof getUserFromRequest>[0],
        mockExecutionContext(user),
      ),
    ).toThrow(InternalServerErrorException);
  });
});
