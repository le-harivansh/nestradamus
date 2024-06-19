import { AuthenticationModuleOptions } from '@application/authentication/authentication.module-options';

export const enum Configuration {
  APPLICATION_NAME = 'test-application',
  APPLICATION_SECRET = 'application-secret-application-secret-application-secret-application-secret',
  REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER = 'user',
}

export const authenticatedUser = {
  id: '1234567890',
  username: 'user@email.dev',
  password: 'password',
} as const;

export const authenticationModuleConfiguration: AuthenticationModuleOptions = {
  routes: {
    login: 'login',
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
    Configuration.REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER,

  jwt: {
    algorithm: 'HS512',
    issuer: Configuration.APPLICATION_NAME,
    audience: Configuration.APPLICATION_NAME,
    secret: Configuration.APPLICATION_SECRET,
  },

  accessToken: {
    cookieName: 'user.access-token',
    expiresInSeconds: 15 * 60, // 15 minutes
  },

  refreshToken: {
    cookieName: 'user.refresh-token',
    expiresInSeconds: 7 * 24 * 60 * 60, // 1 week
  },

  callbacks: {
    resolveUser: {
      byUsername: (username: string) =>
        Promise.resolve(
          username === authenticatedUser.username ? authenticatedUser : null,
        ),
      byId: (id: string) =>
        Promise.resolve(id === authenticatedUser.id ? authenticatedUser : null),
    },

    extractUserId: (user: typeof authenticatedUser) => user.id,

    validatePassword: (user: typeof authenticatedUser, password: string) =>
      Promise.resolve(password === user.password),
  },
};
