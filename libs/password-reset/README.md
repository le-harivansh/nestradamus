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

The configuration options are documented in the `password-reset.module-options.ts` file. The module can be configured as follows:

```ts
PasswordResetLibraryModule.forRootAsync({
  imports: [UserModule, PasswordResetModule],
  inject: [
    UserService,
    PasswordResetService,
    MailService,
    ConfigurationService,
  ],
  useFactory: (
    userService: UserService,
    passwordResetService: PasswordResetService,
    mailService: MailService,
    configurationService: ConfigurationService,
  ) => ({
    route: {
      forgotPassword: FORGOT_PASSWORD_ROUTE,
      resetPassword: RESET_PASSWORD_ROUTE, // <-- this should end in '/:id'
    },

    callback: {
      resolveUser: (email: string) => userService.findUserByEmail(email),

      notifyUser: async (
        user: WithId<User>,
        passwordReset: WithId<PasswordReset>,
      ) => {
        const applicationName =
          configurationService.getOrThrow('application.name');
        const mailTemplate = (
          await readFile(
            join(__dirname, 'template/forgot-password.mjml.mustache'),
          )
        ).toString();

        // todo: this should be throttled to prevent abuse.
        await mailService
          .mail()
          .to(user.email)
          .subject(`Forgot your ${applicationName} password?`)
          .mjml(mailTemplate, {
            applicationName,
            user,
            passwordResetLink: `${configurationService.getOrThrow('application.frontendUrl')}/password-reset/${passwordReset._id}`,
            currentYear: new Date().getFullYear(),
          })
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
        passwordResetService.createOrUpdatePasswordResetRecordForUser(userId),

      deletePasswordReset: (id: string) => {
        if (!ObjectId.isValid(id)) {
          throw new BadRequestException(
            `The provided password-reset record id: '${id}' - cannot be converted to an ObjectId.`,
          );
        }

        return passwordResetService.deletePasswordResetRecord(new ObjectId(id));
      },

      resetUserPassword: async (
        {
          user: { _id: userId },
        }: Awaited<
          ReturnType<PasswordResetService['findPasswordResetRecordById']>
        >,
        newPassword: string,
      ) => {
        class Password {
          @IsStrongPassword({
            minLength: PASSWORD_CONSTRAINTS.MIN_LENGTH,
            minLowercase: PASSWORD_CONSTRAINTS.MIN_LOWERCASE,
            minUppercase: PASSWORD_CONSTRAINTS.MIN_UPPERCASE,
            minNumbers: PASSWORD_CONSTRAINTS.MIN_NUMBERS,
            minSymbols: PASSWORD_CONSTRAINTS.MIN_SYMBOLS,
          })
          readonly value: string;

          constructor(value: string) {
            this.value = value;
          }
        }

        try {
          await validateOrReject(new Password(newPassword));
        } catch (errors) {
          throw new BadRequestException(errors);
        }

        await userService.updateUser(userId, { password: newPassword });
      },
    },
  }),
});
```

## Routes

### Forgot Password

This route is used to notify the server that the user has forgotten their password, and that they intend to reset it.

```http
POST https://localhost:3000/forgot-password HTTP/1.1
content-type: application/json

{
  "username": "user@email.dev",
}
```

### Reset Password

#### `GET`

This route is used to retrieve the password-reset request's data.

```http
GET https://localhost:3000/reset-password/<PASSWORD-RESET-ID> HTTP/1.1
```

#### `POST`

This route is used to reset the user's password.

```http
POST https://localhost:3000/reset-password/<PASSWORD-RESET-ID> HTTP/1.1
content-type: application/json

{
  "newPassword": "new-password",
}
```
