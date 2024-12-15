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
import { PERMISSION_STRING_SEPARATOR } from './constant';
import { permissionsMap } from './permissions-map';
import { REQUEST_PROPERTY_HOLDING_USER, TestUser, testUser } from './test-user';
import { TEST_BASE_ROUTE, TestController } from './test.controller';

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
  controllers: [TestController],
})
export class TestModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(authenticateUser(testUser, REQUEST_PROPERTY_HOLDING_USER))
      .exclude({ path: `${TEST_BASE_ROUTE}`, method: RequestMethod.DELETE })
      .forRoutes(TestController);
  }
}
