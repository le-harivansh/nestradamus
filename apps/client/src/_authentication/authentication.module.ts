import { Module } from '@nestjs/common';
import { verify } from 'argon2';
import { WithId } from 'mongodb';

import { AuthenticationModule as AuthenticationLibraryModule } from '@application/authentication';

import { ConfigurationModule } from '../_configuration/configuration.module';
import { ConfigurationService } from '../_configuration/service/configuration.service';
import { UserRepository } from '../_user/repository/user.repository';
import { User } from '../_user/schema/user.schema';
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
      inject: [ConfigurationService, UserRepository],
      useFactory: (
        configurationService: ConfigurationService,
        userRepository: UserRepository,
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
          validateCredentials: async (username: string, password: string) => {
            const user = await userRepository.findByEmail(username);

            if (!user || !(await verify(user.password, password))) {
              return null;
            }

            return user;
          },

          accessToken: {
            createJwtPayload: (user: WithId<User>) =>
              Promise.resolve({ id: user._id.toString() }),
            validateJwtPayload: (payload: Record<string, unknown>) =>
              Promise.resolve(Boolean(payload['id'])),
            resolveUserFromJwtPayload: (payload: Record<string, unknown>) =>
              userRepository.findById(payload['id'] as string),
          },

          refreshToken: {
            createJwtPayload: (user: WithId<User>) =>
              Promise.resolve({ id: user._id.toString() }),
            validateJwtPayload: (payload: Record<string, unknown>) =>
              Promise.resolve(Boolean(payload['id'])),
            resolveUserFromJwtPayload: (payload: Record<string, unknown>) =>
              userRepository.findById(payload['id'] as string),
          },
        },
      }),
    }),
  ],
})
export class AuthenticationModule {}
