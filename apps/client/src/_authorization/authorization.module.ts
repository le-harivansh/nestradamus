import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Request } from 'express';
import { WithId } from 'mongodb';

import {
  AuthorizationGuard,
  AuthorizationModule as AuthorizationLibraryModule,
} from '@library/authorization';

import { User } from '../_user/schema/user.schema';
import { PERMISSION_STRING_SEPARATOR } from './constant';
import { createPermissionsMap } from './permission-map';

@Module({
  imports: [
    AuthorizationLibraryModule.forRootAsync({
      useFactory: () => ({
        permissionsMap: createPermissionsMap(),
        permissionStringSeparator: PERMISSION_STRING_SEPARATOR,
        user: {
          retrieveFromRequest: ({ user }: Request) => user,
          getPermissions: ({ permissions }: WithId<User>) => permissions,
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
})
export class AuthorizationModule {}
