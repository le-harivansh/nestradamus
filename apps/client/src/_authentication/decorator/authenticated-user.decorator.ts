import { AuthenticatedUserDecoratorFactory } from '@application/authentication/decorator/authenticated-user.decorator-factory';

import { REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER } from '../constant';

export const AuthenticatedUser = AuthenticatedUserDecoratorFactory(
  REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER,
);
