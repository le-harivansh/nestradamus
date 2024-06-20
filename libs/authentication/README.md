# Authentication Library

This library is used to authenticate users. It exposes the following classes:

- `AuthenticatedModule`: which is used to import and configure the library within an application;
- `AuthenticatedUserDecoratorFactory`: which is used to create a decorator - which will be used to get the authenticated user from the configured property in the current `request` object.

### Assumptions

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

The route will then respond with an _access-token_ and a _refresh-token_; each in an _HTTP-only_ cookie - if the provided credentials are correct.

#### Logout

This route requires that the user has a valid _access-token_.
The route responds by clearing the previously set _access-token_ and _refresh-token_ _HTTP-only_ cookies.

#### Refresh Access-Token

This route requires that the user has a valid _refresh-token_.
The route responds with a new _access-token_ - if the provided _refresh-token_ is valid.

#### Refresh Refresh-Token

This route requires that the user has a valid _access-token_.
The route responds with a new _refresh-token_ - if the provided _access-token_ is valid.

### Configuration

#### `AuthenticatedModule`

The configuration options are documented in the `authentication.module-options.ts` file.

e.g.:

```js
AuthenticationLibraryModule.forRootAsync({
  imports: [ConfigurationModule],
  inject: [ConfigurationService],
  useFactory: (configurationService: ConfigurationService) => ({
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

    requestPropertyHoldingAuthenticatedUser: 'user',

    jwt: {
      algorithm: 'HS512',
      issuer: configurationService.getOrThrow('application.name'),
      audience: configurationService.getOrThrow('application.name'),
      secret: configurationService.getOrThrow('application.secret'),
    },

    accessToken: {
      cookieName: 'client.access-token',
      expiresInSeconds: 15 * 60, // 15 minutes
    },

    refreshToken: {
      cookieName: 'client.refresh-token',
      expiresInSeconds: 7 * 24 * 60 * 60, // 1 week
    },

    callbacks: {
      userResolver: {
        byUsername: (username: string) => (userRepository as UserRepository).findByEmail(username),
        byId: (id: string) => (userRepository as UserRepository).findById(id),
      },

      userIdExtractor: ({ _id }: WithId<User>) => _id.toString(),

      passwordValidator: (user: WithId<User>, password: string) => verify(user.password, password),
    }
  }),
}),
```
