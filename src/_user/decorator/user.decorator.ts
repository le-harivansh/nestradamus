import {
  BadRequestException,
  ExecutionContext,
  InternalServerErrorException,
  createParamDecorator,
} from '@nestjs/common';

import type { RequestUser } from '../schema/user.schema';

export function getUserFromRequest(
  property: keyof RequestUser | undefined,
  context: ExecutionContext,
): string | RequestUser {
  const user = context.switchToHttp().getRequest().user as RequestUser;

  if (!user) {
    throw new BadRequestException(
      'Could not retrieve the user from the request object.',
    );
  }

  if (property && !Object.hasOwn(user, property)) {
    throw new InternalServerErrorException(
      `Property '${property}' does not exist on the user property in the request object.`,
    );
  }

  return property ? user[property] : user;
}

export const User = createParamDecorator(getUserFromRequest);
