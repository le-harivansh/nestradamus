import { Module, NotFoundException, RequestMethod } from '@nestjs/common';
import { verify } from 'argon2';
import { ObjectId, WithId } from 'mongodb';

import { AuthenticationModule as AuthenticationLibraryModule } from '@library/authentication';

import { ConfigurationModule } from '../_configuration/configuration.module';
import { ConfigurationService } from '../_configuration/service/configuration.service';
import { HEALTHCHECK_ROUTE } from '../_health-check/constant';
import {
  FORGOT_PASSWORD_ROUTE,
  RESET_PASSWORD_ROUTE,
} from '../_password-reset/constant';
import { User } from '../_user/schema/user.schema';
import { UserService } from '../_user/service/user.service';
import { UserModule } from '../_user/user.module';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_REFRESH_ROUTE,
  LOGIN_ROUTE,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_REFRESH_ROUTE,
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
          login: LOGIN_ROUTE,
          tokenRefresh: {
            accessToken: ACCESS_TOKEN_REFRESH_ROUTE,
            refreshToken: REFRESH_TOKEN_REFRESH_ROUTE,
          },
        },

        middleware: {
          requiresAccessToken: {
            forRoutes: ['*'],
            except: [
              { path: HEALTHCHECK_ROUTE, method: RequestMethod.GET },

              { path: FORGOT_PASSWORD_ROUTE, method: RequestMethod.POST },

              { path: RESET_PASSWORD_ROUTE, method: RequestMethod.GET },
              { path: RESET_PASSWORD_ROUTE, method: RequestMethod.POST },
            ],
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
                const userId = new ObjectId(payload['id'] as string);

                /**
                 * We need to anchor the `Promise` with `await` here
                 * to be able to catch any error that occurs in
                 * `UserService::findUserById`.
                 */
                return await userService.findUserById(userId);
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
                const userId = new ObjectId(payload['id'] as string);

                /**
                 * We need to anchor the `Promise` with `await` here
                 * to be able to catch any error that occurs in
                 * `UserService::findUserById`.
                 */
                return await userService.findUserById(userId);
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
