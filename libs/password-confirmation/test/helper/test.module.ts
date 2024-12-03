import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

import { PasswordConfirmationModuleOptions } from '@library/password-confirmation/password-confirmation.module-options';

import { PasswordConfirmationModule } from '../../src';
import { authenticateUser } from './authentication.middleware';
import { TEST_BASE_ROUTE, UNAUTHENTICATED_ROUTE } from './test.controller';
import { testUser, User } from './user';

const REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER = 'user';

export const passwordConfirmationModuleOptions: PasswordConfirmationModuleOptions =
  {
    route: 'confirm-password',

    cookie: {
      name: 'user.password-confirmation-token',
      expiresInSeconds: 10 * 60, // 10 minutes
    },

    callback: {
      user: {
        retrieveFrom: (request: Request) =>
          (
            request as unknown as {
              [REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER]: User;
            }
          )[REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER],

        validatePassword: (user: User, password: string) =>
          Promise.resolve(user.password === password),
      },

      cookie: {
        createPayload: (user: User) => Promise.resolve(user.password),

        validatePayload: (user: User, cookiePayload: string) =>
          Promise.resolve(cookiePayload === user.password),
      },
    },
  };

@Module({
  imports: [
    PasswordConfirmationModule.forRoot({
      ...passwordConfirmationModuleOptions,
      isGlobal: true,
    }),
  ],
})
export class TestModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        authenticateUser(testUser, REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER),
      )
      .exclude({
        path: `/${TEST_BASE_ROUTE}/${UNAUTHENTICATED_ROUTE}`,
        method: RequestMethod.GET,
      })
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
