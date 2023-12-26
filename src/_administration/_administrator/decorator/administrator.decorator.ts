import { createParamDecorator } from '@nestjs/common';

import { getAuthenticatedEntityFromRequest } from '@/_library/authentication/decorator/authenticated-entity.decorator';

import type { Administrator } from '../schema/administrator.schema';

export const AuthenticatedAdministrator = createParamDecorator(
  getAuthenticatedEntityFromRequest<Administrator>('administrator'),
);
