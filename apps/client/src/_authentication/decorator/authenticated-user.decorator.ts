import { AuthenticatedUserDecoratorFactory } from '@library/authentication';

import { REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER } from '../constant';

export const AuthenticatedUser = AuthenticatedUserDecoratorFactory(
  REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER,
);
