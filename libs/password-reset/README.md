# Password Reset

This library is used to reset the password of users of the application.

## Password-reset flow

It uses a standard flow for resetting the password of a user:

1. User sends a request to notify the server that they have forgotten their password.
2. The server creates a database record of the request with the user's id, and any relevant data.
3. The server sends a notification to the user.
4. The user sends a request (with an identifier that the server communicated to the user via the notification in step 3) to reset their password.
5. The user's password is reset.

The above flow is roughly implemented as follows:

1. User `POST`s their `username` to the configured `forgot-password` route.
2. Server creates a `PasswordReset` record & notifies the user.
3. User `POST`s their _new password_ with the previously created `PasswordReset`'s' id.
4. The server validates & changes their password.

## Configuration

The configuration options are documented in the `password-reset.module-options.ts` file.

e.g.:

```js
PasswordResetLibraryModule.forRootAsync({
  imports: [UserModule, PasswordResetModule],
  inject: [UserService, PasswordResetService, MailService],
  useFactory: (
    userService: UserService,
    passwordResetService: PasswordResetService,
    mailService: MailService,
  ) => ({
    route: {
      forgotPassword: 'forgot-password',
      resetPassword: 'reset-password/:id', // <-- this route should end in '/:id'
    },

    callback: {
      resolveUser: (email: string) => userService.findUserByEmail(email),

      notifyUser: async (
        user: WithId<User>,
        passwordReset: WithId<PasswordReset>,
      ) => {
        await mailService
          .mail()
          .to(user.email)
          .subject('forgot password')
          .text(passwordReset._id.toString())
          .send();
      },

      retrievePasswordReset: (id: string) => {
        if (!ObjectId.isValid(id)) {
          throw new BadRequestException(
            `The provided password-reset record id: '${id}' - cannot be converted to an ObjectId.`,
          );
        }

        return passwordResetService.findPasswordResetRecordById(
          new ObjectId(id),
        );
      },

      createPasswordReset: ({ _id: userId }: WithId<User>) =>
        passwordResetService.createPasswordResetRecordForUser(userId),

      deletePasswordReset: (id: string) => {
        if (!ObjectId.isValid(id)) {
          throw new BadRequestException(
            `The provided password-reset record id: '${id}' - cannot be converted to an ObjectId.`,
          );
        }

        return passwordResetService.deletePasswordResetRecord(
          new ObjectId(id),
        );
      },

      resetUserPassword: async (
        passwordReset: string,
        newPassword: string,
      ) => {
        if (!ObjectId.isValid(passwordReset)) {
          throw new BadRequestException(
            `The provided password-reset record id: '${passwordReset}' - cannot be converted to an ObjectId.`,
          );
        }

        const { userId } =
          await passwordResetService.findPasswordResetRecordById(
            new ObjectId(passwordReset),
          );

        // @todo: validate that the password fits the required criteria.

        await userService.updateUser(userId, { password: newPassword });
      },
    },
  }),
}),
```

## Routes

### Forgot Password

This route is used to notify the server that the user has forgotten their password, and that they intend to reset it.

```
POST https://localhost:3000/forgot-password HTTP/1.1
content-type: application/json

{
  "username": "user@email.dev",
}
```

### Reset Password

#### `GET`

This route is used to retrieve the password-reset request's data.

```
GET https://localhost:3000/reset-password/<ID> HTTP/1.1
```

#### `POST`

This route is used to reset the user's password.

```
POST https://localhost:3000/reset-password/<ID> HTTP/1.1
content-type: application/json

{
  "newPassword": "new-password",
}
```
