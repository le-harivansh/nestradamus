import {
  ExecutionContext,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { model } from 'mongoose';

import { User, UserDocument, UserSchema } from '../schema/user.schema';
import { getUserFromRequest } from './user.decorator';

describe(getUserFromRequest.name, () => {
  const mockExecutionContext = (user?: UserDocument) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  const UserModel = model(User.name, UserSchema);
  const userDocument = new UserModel({
    email: 'user@email.com',
  });

  it('returns the user object attached to the request object', () => {
    expect(
      getUserFromRequest(undefined, mockExecutionContext(userDocument)),
    ).toBe(userDocument);
  });

  it("returns the value of the specified property from the user's object", () => {
    expect(
      getUserFromRequest('email', mockExecutionContext(userDocument)),
    ).toBe(userDocument.email);
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
        mockExecutionContext(userDocument),
      ),
    ).toThrow(InternalServerErrorException);
  });
});
