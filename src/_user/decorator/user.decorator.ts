import {
  ExecutionContext,
  InternalServerErrorException,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { Require_id } from 'mongoose';

import type { UserDocument, User as UserEntity } from '../schema/user.schema';

export function getUserFromRequest(
  property: keyof Require_id<UserEntity> | undefined,
  context: ExecutionContext,
): UserDocument | Require_id<UserEntity>[keyof Require_id<UserEntity>] {
  const user = context.switchToHttp().getRequest().user as UserDocument;

  if (!user) {
    throw new UnauthorizedException(
      'Could not retrieve the user from the request.',
    );
  }

  if (property && user.schema.path(property) === undefined) {
    throw new InternalServerErrorException(
      `Property '${property}' does not exist on the (authenticated) user in the current request.`,
    );
  }

  return property ? user.get(property) : user;
}

export const User = createParamDecorator(getUserFromRequest);
