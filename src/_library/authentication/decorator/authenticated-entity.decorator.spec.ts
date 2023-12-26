import {
  ExecutionContext,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prop, SchemaFactory } from '@nestjs/mongoose';

import { newDocument } from '@/_library/test.helper';

import { Authenticatable } from '../schema/authenticatable.interface';
import type { RequestPropertyStoringAuthenticatedEntity } from '../type';
import { getAuthenticatedEntityFromRequest } from './authenticated-entity.decorator';

describe(getAuthenticatedEntityFromRequest.name, () => {
  class User implements Authenticatable {
    @Prop({ required: true, unique: true })
    username!: string;

    @Prop({ required: true })
    password!: string;
  }

  const UserSchema = SchemaFactory.createForClass(User);

  /**
   * Apparently in this test, the new document created only has an `_id`
   * property.
   *
   * This is most probably due to the fact that the test is started in a context
   * without mongodb or mongoose.
   */
  const authenticatedUser = newDocument<User>(User, UserSchema, {
    username: 'user@email.com',
    password: 'P@ssw0rd',
  });

  const mockExecutionContext = (request: object) =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    }) as ExecutionContext;

  const requestPropertyStoringAuthenticatedEntity: RequestPropertyStoringAuthenticatedEntity =
    'user';
  const request = {
    [requestPropertyStoringAuthenticatedEntity]: authenticatedUser,
  };

  it('throws an `InternalServerErrorException` if the request object does not have the specified property storing the authenticated entity', () => {
    expect(() =>
      getAuthenticatedEntityFromRequest<User>(
        'invalidPropertyOnRequest' as RequestPropertyStoringAuthenticatedEntity,
      )(undefined, mockExecutionContext(request)),
    ).toThrow(InternalServerErrorException);
  });

  it('throws an `UnauthorizedException` if the specified request property is empty', () => {
    expect(() =>
      getAuthenticatedEntityFromRequest<User>(
        requestPropertyStoringAuthenticatedEntity,
      )(
        undefined,
        mockExecutionContext({
          [requestPropertyStoringAuthenticatedEntity]: undefined,
        }),
      ),
    ).toThrow(UnauthorizedException);
  });

  it('throws an `InternalServerErrorException` if the specified property does not exist on the authenticated entity', () => {
    expect(() =>
      getAuthenticatedEntityFromRequest<User>(
        requestPropertyStoringAuthenticatedEntity,
      )('invalidPropertyOnEntity' as keyof User, mockExecutionContext(request)),
    ).toThrow(InternalServerErrorException);
  });

  it('returns the authenticated entity if no property is specified for extraction', () => {
    expect(
      getAuthenticatedEntityFromRequest<User>(
        requestPropertyStoringAuthenticatedEntity,
      )(undefined, mockExecutionContext(request)),
    ).toBe(authenticatedUser);
  });

  it('returns the specified property of the authenticated entity when specified for extraction', () => {
    const expectedPassword = 'P@ssw0rd';

    expect(
      getAuthenticatedEntityFromRequest<User>(
        requestPropertyStoringAuthenticatedEntity,
      )(
        'password',
        mockExecutionContext({
          [requestPropertyStoringAuthenticatedEntity]: {
            get: () => expectedPassword,
            schema: {
              path: () =>
                true /* we don't really care what this method returns, as long as it is not `undefined`. */,
            },
          },
        }),
      ),
    ).toBe(expectedPassword);
  });
});
