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
        routes: {
          login: {
            withCredentials: 'login',
          },
          refresh: {
            accessToken: 'token-refresh/access-token',
            refreshToken: 'token-refresh/refresh-token',
          },
        },

        authenticateUser: {
          forRoutes: ['*'],
          except: [],
        },

        requestPropertyHoldingAuthenticatedUser:
          REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER,

        jwt: {
          algorithm: 'HS512',
          issuer: configurationService.getOrThrow('application.name'),
          audience: configurationService.getOrThrow('application.name'),
          secret: configurationService.getOrThrow('application.secret'),
        },

        accessToken: {
          cookieName: ACCESS_TOKEN_COOKIE_NAME,
          expiresInSeconds: 15 * 60, // 15 minutes
        },

        refreshToken: {
          cookieName: REFRESH_TOKEN_COOKIE_NAME,
          expiresInSeconds: 7 * 24 * 60 * 60, // 1 week
        },

        callbacks: {
          resolveUser: {
            byUsername: (username: string) =>
              userRepository.findByEmail(username),
            byId: (id: string) => userRepository.findById(id),
          },

          extractUserId: ({ _id }: WithId<User>) => _id.toString(),

          validatePassword: (user: WithId<User>, password: string) =>
            verify(user.password, password),
        },
      }),
    }),
  ],
})
export class AuthenticationModule {}
