# Password-Confirmation

This library is used to confirm the password of authenticated users. It exposes the following classes:

- `PasswordConfirmationModule`: which is used to import & configure the library within the application.
- `RequiresPasswordConfirmation`: which is used to guard routes that need a _password-confirmation_ cookie before being accessed.
- `ResponseService`: which is used to set & clear the _password-confirmation_ cookie in circumstances such as login & logout.

## Configuration

This module can be configured as follows:

```ts
PasswordConfirmationLibraryModule.forRootAsync({
  useFactory: () => ({
    route: 'password-confirmation',
    cookie: {
      name: 'user.password-confirmation',
      expiresInSeconds: 10 * 60, // 10 minutes
    },
    callback: {
      user: {
        retrieveFrom: ({ user }: Request) => user,

        validatePassword: async (user: WithId<User>, password: string) =>
          await verify(user.password, password),
      },

      cookie: {
        createPayload: async (user: WithId<User>) =>
          await hash(user.password, { type: argon2id }),

        validatePayload: async (user: WithId<User>, cookiePayload: string) =>
          await verify(cookiePayload, user.password),
      },
    },
  }),

  isGlobal: true,
});
```

## Routes

The only route exposed by this module is the one specified in the configuration block as the `route` key.

This route is used to confirm the password of the currently authenticated user.

It responds with a HTTP 204 (No-Content) with the new _password-confirmation_ cookie - if the provided _password_ is valid, and HTTP 401 (Unauthorized) otherwise.

## Guard

To guard routes that requires the user to confirm its password, the `RequiresPasswordConfirmation` guard is provided.

## Assumptions

It is assumed that the `RequiresPasswordConfirmation` guard will be used on authenticated routes; otherwise a HTTP 401 (Unauthorized) will be returned.
