# Authentication Library

This library is used to authenticate users. It exposes the following classes:

- `AuthenticationModule`: which is used to import and configure the library within an application;
- `AuthenticatedUserDecoratorFactory`: which is used to create a decorator - which will be used to get the authenticated user from the configured property in the current `request` object.

## Assumptions

This module uses **JSON Web Tokens** in **!SIGNED! _HTTPS_ cookies** to authenticate a user.

### Authentication

#### Login

This module uses credentials authentication to authenticate a user. To do so, a `POST` request should be made to the provided login route with a body of the following shape:

```json
{
  "username": "<username of user to authenticate>",
  "password": "<password of user to authenticate>"
}
```

The route will then respond with a HTTP 204 (No-Content), with an _access-token_ and a _refresh-token_; each in an _HTTP-only_ cookie - if the provided credentials are correct.

#### Logout

This route requires that the user has a valid _access-token_.
The route responds with a HTTP 204 (No-Content), and clears the previously set _access-token_ and _refresh-token_ _HTTP-only_ cookies.

#### Refresh Access-Token

This route requires that the user has a valid _refresh-token_.
The route responds with a HTTP 204 (No-Content) with the new _access-token_ - if the provided _refresh-token_ is valid.

#### Refresh Refresh-Token

This route requires that the user has a valid _access-token_.
The route responds with a HTTP 204 (No-Content) with the new _refresh-token_ - if the provided _access-token_ is valid.

### Password-Confirmation

This route requires that the user has a valid _access-token_.
The route responds with a HTTP 204 (No-Content) with the new _password-confirmation_ cookie - if the provided _password_ is valid.

### Configuration

#### `AuthenticatedModule`

The configuration options are documented in the `authentication.module-options.ts` file. The module can be configured as follows:

```ts
AuthenticationLibraryModule.forRootAsync({
  imports: [ConfigurationModule, UserModule],
  inject: [ConfigurationService, UserService],
  useFactory: (
    configurationService: ConfigurationService,
    userService: UserService,
  ) => ({
    route: {
      login: LOGIN_ROUTE,
      passwordConfirmation: PASSWORD_CONFIRMATION_ROUTE,
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
      passwordConfirmation: {
        name: PASSWORD_CONFIRMATION_COOKIE_NAME,
        expiresInSeconds: 10 * 60, // 10 minutes
      },

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
      retrieveUser: async (email: string) => {
        let user: WithId<User> | null = null;

        try {
          user = await userService.findUserByEmail(email);
        } catch (error) {
          if (!(error instanceof NotFoundException)) {
            throw error;
          }
        }

        return user;
      },

      validatePassword: async (user: WithId<User>, password: string) =>
        await verify(user.password, password),

      passwordConfirmation: {
        createCookiePayload: async (user: WithId<User>) =>
          await hash(user.password, { type: argon2id }),
        validateCookiePayload: async (
          user: WithId<User>,
          cookiePayload: string,
        ) => await verify(cookiePayload, user.password),
      },

      accessToken: {
        createJwtPayload: async (user: WithId<User>) =>
          await Promise.resolve({ id: user._id.toString() }),

        validateJwtPayload: async (payload: Record<string, unknown>) =>
          await Promise.resolve(Boolean(payload['id'])),

        resolveUserFromJwtPayload: async (payload: Record<string, unknown>) => {
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

        resolveUserFromJwtPayload: async (payload: Record<string, unknown>) => {
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
});
```
