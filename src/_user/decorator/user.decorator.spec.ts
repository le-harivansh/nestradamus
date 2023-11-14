import {
  BadRequestException,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { Types } from 'mongoose';

import { RequestUser } from '../schema/user.schema';
import { getUserFromRequest } from './user.decorator';

describe(getUserFromRequest.name, () => {
  const mockExecutionContext = (user?: RequestUser) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  const user: RequestUser = {
    id: new Types.ObjectId().toString(),
    email: 'zero@zero.com',
  };

  it('returns the user object attached to the request object', () => {
    expect(
      getUserFromRequest(undefined, mockExecutionContext(user)),
    ).toStrictEqual(user);
  });

  it("returns the value of the specified property from the user's object", () => {
    expect(getUserFromRequest('email', mockExecutionContext(user))).toBe(
      user.email,
    );
  });

  it('throws a bad-request http error if the request has no user object', () => {
    expect(() => getUserFromRequest(undefined, mockExecutionContext())).toThrow(
      BadRequestException,
    );
  });

  it('throws a server-error if the queried property does not exist on the user object', () => {
    expect(() =>
      getUserFromRequest(
        'nope' as unknown as Parameters<typeof getUserFromRequest>[0],
        mockExecutionContext(user),
      ),
    ).toThrow(InternalServerErrorException);
  });
});
