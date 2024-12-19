import {
  Module,
  NotFoundException,
  RequestMethod,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'argon2';
import { Request, Response } from 'express';
import { ObjectId, WithId } from 'mongodb';

import { AuthenticationModule as AuthenticationLibraryModule } from '@library/authentication';
import { ResponseService as PasswordConfirmationResponseService } from '@library/password-confirmation';

import { ConfigurationModule } from '../_configuration/configuration.module';
import { ConfigurationService } from '../_configuration/service/configuration.service';
import { HEALTHCHECK_ROUTE } from '../_health-check/constant';
import {
  FORGOT_PASSWORD_ROUTE,
  RESET_PASSWORD_ROUTE,
} from '../_password-reset/constant';
import { User } from '../_user/entity/user.entity';
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
      inject: [
        ConfigurationService,
        UserService,
        PasswordConfirmationResponseService,
      ],
      useFactory: (
        configurationService: ConfigurationService,
        userService: UserService,
        passwordConfirmationResponseService: PasswordConfirmationResponseService,
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
            forRoutes: [{ path: '*', method: RequestMethod.ALL }],
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
          user: {
            retrieve: async (email: string) => {
              let user: WithId<User> | null = null;

              try {
                user = await userService.findByEmail(email);
              } catch (error) {
                if (!(error instanceof NotFoundException)) {
                  throw error;
                }
              }

              return user;
            },

            validatePassword: async (user: WithId<User>, password: string) =>
              await verify(user.password, password),
          },

          accessToken: {
            createJwtPayload: (user: WithId<User>) => ({
              id: user._id.toString(),
            }),

            validateJwtPayload: (payload: Record<string, unknown>) =>
              ObjectId.isValid(payload['id'] as string),

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
                return await userService.findById(userId);
              } catch (error) {
                if (error instanceof NotFoundException) {
                  return null;
                }

                throw error;
              }
            },
          },

          refreshToken: {
            createJwtPayload: (user: WithId<User>) => ({
              id: user._id.toString(),
            }),

            validateJwtPayload: (payload: Record<string, unknown>) =>
              ObjectId.isValid(payload['id'] as string),

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
                return await userService.findById(userId);
              } catch (error) {
                if (error instanceof NotFoundException) {
                  return null;
                }

                throw error;
              }
            },
          },
        },

        hook: {
          post: {
            login: async (
              _request: Request,
              response: Response,
              authenticatedUser: WithId<User>,
            ) => {
              if (!authenticatedUser) {
                throw new UnauthorizedException(
                  'Could not retrieve the authenticated user from the request.',
                );
              }

              await passwordConfirmationResponseService.setPasswordConfirmationCookieForUserInResponse(
                authenticatedUser,
                response,
              );
            },

            logout: (
              _request: Request,
              response: Response,
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              _authenticatedUser: WithId<User>,
            ) => {
              passwordConfirmationResponseService.clearPasswordConfirmationCookie(
                response,
              );
            },
          },
        },
      }),
    }),
  ],
})
export class AuthenticationModule {}
