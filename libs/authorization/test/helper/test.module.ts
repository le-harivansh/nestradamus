import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import {
  AuthorizationGuard,
  AuthorizationModule,
} from '@library/authorization';

import { authenticateUser } from './authentication.middleware';
import {
  PERMISSION_STRING_SEPARATOR,
  REQUEST_PROPERTY_HOLDING_USER,
} from './constant';
import {
  BASE_ROUTE as AUTHORIZATION_BASE_ROUTE,
  AuthorizationController,
} from './controller/authorization.controller';
import { ConditionalAuthorizationController } from './controller/conditional-authorization.controller';
import { permissionsMap } from './permissions-map';
import { TestUser, testUser } from './test-user';

@Module({
  imports: [
    AuthorizationModule.forRootAsync({
      useFactory: () => ({
        permissionsMap,
        permissionStringSeparator: PERMISSION_STRING_SEPARATOR,
        callback: {
          user: {
            retrieveFromRequest: (request: Request) =>
              (request as unknown as Record<string, unknown>)[
                REQUEST_PROPERTY_HOLDING_USER
              ],
            getPermissions: ({ permissions }: TestUser) =>
              permissions as unknown as string[],
          },
        },
      }),
      isGlobal: true,
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthorizationGuard,
    },
  ],
  controllers: [AuthorizationController, ConditionalAuthorizationController],
})
export class TestModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(authenticateUser(testUser, REQUEST_PROPERTY_HOLDING_USER))
      .exclude({ path: AUTHORIZATION_BASE_ROUTE, method: RequestMethod.DELETE })
      .forRoutes(AuthorizationController, ConditionalAuthorizationController);
  }
}
