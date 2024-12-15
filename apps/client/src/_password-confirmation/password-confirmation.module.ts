import { Module } from '@nestjs/common';
import { argon2id, hash, verify } from 'argon2';
import { Request } from 'express';
import { WithId } from 'mongodb';

import { PasswordConfirmationModule as PasswordConfirmationLibraryModule } from '@library/password-confirmation';

import { User } from '../_user/schema/user.schema';
import {
  PASSWORD_CONFIRMATION_COOKIE_NAME,
  PASSWORD_CONFIRMATION_ROUTE,
} from './constant';

@Module({
  imports: [
    PasswordConfirmationLibraryModule.forRootAsync({
      useFactory: () => ({
        route: PASSWORD_CONFIRMATION_ROUTE,
        cookie: {
          name: PASSWORD_CONFIRMATION_COOKIE_NAME,
          expiresInSeconds: 10 * 60, // 10 minutes
        },
        callback: {
          user: {
            retrieveFromRequest: ({ user }: Request) => user,

            validatePassword: async (user: WithId<User>, password: string) =>
              await verify(user.password, password),
          },

          cookie: {
            createPayload: async (user: WithId<User>) =>
              await hash(user.password, { type: argon2id }),

            validatePayload: async (
              user: WithId<User>,
              cookiePayload: string,
            ) => await verify(cookiePayload, user.password),
          },
        },
      }),

      isGlobal: true,
    }),
  ],
})
export class PasswordConfirmationModule {}
