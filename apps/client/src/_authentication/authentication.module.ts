import { Module, NotFoundException } from '@nestjs/common';
import { verify } from 'argon2';
import { WithId } from 'mongodb';

import { AuthenticationModule as AuthenticationLibraryModule } from '@application/authentication';

import { ConfigurationModule } from '../_configuration/configuration.module';
import { ConfigurationService } from '../_configuration/service/configuration.service';
import { User } from '../_user/schema/user.schema';
import { UserService } from '../_user/service/user.service';
import { UserModule } from '../_user/user.module';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER,
} from './constant';

@Module({
  imports: [
    AuthenticationLibraryModule.forRootAsync({
      imports: [ConfigurationModule, UserModule],
      inject: [ConfigurationService, UserService],
      useFactory: (
        configurationService: ConfigurationService,
        userService: UserService,
      ) => ({
        route: {
          login: 'login',
          tokenRefresh: {
            accessToken: 'token-refresh/access-token',
            refreshToken: 'token-refresh/refresh-token',
          },
        },

        middleware: {
          requiresAccessToken: {
            forRoutes: ['*'],
            except: [],
          },
        },

        requestPropertyHoldingAuthenticatedUser:
          REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER,

        jwt: {
          algorithm: 'HS512',
          issuer: configurationService.getOrThrow('application.name'),
          audience: configurationService.getOrThrow('application.name'),
          secret: configurationService.getOrThrow('application.secret'),
        },

        cookie: {
          accessToken: {
            name: ACCESS_TOKEN_COOKIE_NAME,
            expiresInSeconds: 15 * 60, // 15 minutes
          },

          refreshToken: {
            name: REFRESH_TOKEN_COOKIE_NAME,
            expiresInSeconds: 7 * 24 * 60 * 60, // 1 week
          },
        },

        callback: {
          validateCredentials: async (email: string, password: string) => {
            let user: WithId<User>;

            try {
              user = await userService.findUserByEmail(email);
            } catch (error) {
              if (error instanceof NotFoundException) {
                return null;
              }

              throw error;
            }

            if (!(await verify(user.password, password))) {
              return null;
            }

            return user;
          },

          accessToken: {
            createJwtPayload: (user: WithId<User>) =>
              Promise.resolve({ id: user._id.toString() }),

            validateJwtPayload: (payload: Record<string, unknown>) =>
              Promise.resolve(Boolean(payload['id'])),

            resolveUserFromJwtPayload: async (
              payload: Record<string, unknown>,
            ) => {
              try {
                /**
                 * We need to anchor the `Promise` with `await` here
                 * to be able to catch any error that occurs in
                 * `UserService::findUserById`.
                 */
                return await userService.findUserById(payload['id'] as string);
              } catch (error) {
                if (error instanceof NotFoundException) {
                  return null;
                }

                throw error;
              }
            },
          },

          refreshToken: {
            createJwtPayload: (user: WithId<User>) =>
              Promise.resolve({ id: user._id.toString() }),

            validateJwtPayload: (payload: Record<string, unknown>) =>
              Promise.resolve(Boolean(payload['id'])),

            resolveUserFromJwtPayload: async (
              payload: Record<string, unknown>,
            ) => {
              try {
                /**
                 * We need to anchor the `Promise` with `await` here
                 * to be able to catch any error that occurs in
                 * `UserService::findUserById`.
                 */
                return await userService.findUserById(payload['id'] as string);
              } catch (error) {
                if (error instanceof NotFoundException) {
                  return null;
                }

                throw error;
              }
            },
          },
        },
      }),
    }),
  ],
})
export class AuthenticationModule {}
