import {
  ExecutionContext,
  InternalServerErrorException,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';

import { ModelWithId } from '@/_library/helper';

import type { UserDocument, User as UserModel } from '../schema/user.schema';

export function getUserFromRequest(
  property: keyof ModelWithId<UserModel> | undefined,
  context: ExecutionContext,
): UserDocument | ModelWithId<UserModel>[keyof ModelWithId<UserModel>] {
  const userDocument = context.switchToHttp().getRequest().user as UserDocument;

  if (!userDocument) {
    throw new UnauthorizedException(
      'Could not retrieve the user from the request.',
    );
  }

  if (property && !Object.hasOwn(userDocument.toObject(), property)) {
    throw new InternalServerErrorException(
      `Property '${property}' does not exist on the (authenticated) user in the current request.`,
    );
  }

  return property ? userDocument.get(property) : userDocument;
}

export const User = createParamDecorator(getUserFromRequest);
