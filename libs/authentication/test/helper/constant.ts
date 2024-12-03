import { RequestMethod } from '@nestjs/common';
import { ObjectId } from 'mongodb';

import { AuthenticationModuleOptions } from '@library/authentication/authentication.module-options';

export const enum Configuration {
  APPLICATION_NAME = 'test-application',
  APPLICATION_SECRET = 'application-secret-application-secret-application-secret-application-secret',
  REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER = 'user',
}

export const authenticatedUser = {
  id: new ObjectId(),
  username: 'user@email.dev',
  password: 'password',
} as const;

export const authenticationModuleConfiguration: AuthenticationModuleOptions = {
  route: {
    login: 'login',
    tokenRefresh: {
      accessToken: 'token-refresh/access-token',
      refreshToken: 'token-refresh/refresh-token',
    },
  },

  middleware: {
    requiresAccessToken: {
      forRoutes: [{ path: '*', method: RequestMethod.ALL }],
      except: [],
    },
  },

  requestPropertyHoldingAuthenticatedUser:
    Configuration.REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER,

  jwt: {
    algorithm: 'HS512',
    issuer: Configuration.APPLICATION_NAME,
    audience: Configuration.APPLICATION_NAME,
    secret: Configuration.APPLICATION_SECRET,
  },

  cookie: {
    accessToken: {
      name: 'user.access-token',
      expiresInSeconds: 15 * 60, // 15 minutes
    },

    refreshToken: {
      name: 'user.refresh-token',
      expiresInSeconds: 7 * 24 * 60 * 60, // 1 week
    },
  },

  callback: {
    user: {
      retrieve: (username: string) =>
        Promise.resolve(
          username === authenticatedUser.username ? authenticatedUser : null,
        ),
      validatePassword: (user: typeof authenticatedUser, password: string) =>
        Promise.resolve(password === user.password),
    },

    accessToken: {
      createJwtPayload: (user: typeof authenticatedUser) =>
        Promise.resolve({ id: user.id.toString() }),
      validateJwtPayload: () => Promise.resolve(true),
      resolveUserFromJwtPayload: (payload: Record<string, unknown>) =>
        payload['id'] === authenticatedUser.id.toString()
          ? Promise.resolve(authenticatedUser)
          : Promise.reject(new Error()),
    },

    refreshToken: {
      createJwtPayload: (user: typeof authenticatedUser) =>
        Promise.resolve({ id: user.id.toString() }),
      validateJwtPayload: () => Promise.resolve(true),
      resolveUserFromJwtPayload: (payload: Record<string, unknown>) =>
        payload['id'] === authenticatedUser.id.toString()
          ? Promise.resolve(authenticatedUser)
          : Promise.reject(new Error()),
    },
  },

  hook: {
    post: {
      login: () => undefined,
      logout: () => undefined,
    },
  },
};
