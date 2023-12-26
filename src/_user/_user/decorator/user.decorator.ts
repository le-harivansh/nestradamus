import { createParamDecorator } from '@nestjs/common';

import { getAuthenticatedEntityFromRequest } from '@/_library/authentication/decorator/authenticated-entity.decorator';

import type { User } from '../schema/user.schema';

export const AuthenticatedUser = createParamDecorator(
  getAuthenticatedEntityFromRequest<User>('user'),
);
