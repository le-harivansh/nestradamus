import { z } from 'zod';

export const passwordResetModuleOptionsValidationSchema = z.object({
  /**
   * This configuration block defines the routes of the module.
   */
  route: z.object({
    /**
     * This is the route where the authenticated user's username - in the form
     * of a POST request with a body having the shape: `{ "username": "..." }`
     * is sent to the server.
     *
     * This route will return a HTTP 204 (No-Content) response code on success.
     */
    forgotPassword: z.string().min(1),

    /**
     * This is the route where the details of the 'password-reset' record can
     * be retrieved through a GET request, and will return a HTTP 200 (OK)
     * response code on success.
     *
     *
     * This is also the route where the new password - in the form of a POST
     * request with a body having the shape: `{ "newPassword": "..." }` is sent
     * to the server, and will return a HTTP 204 (No-Content) response code on
     * success.
     *
     * In both forms (GET & POST), the 'id' of the 'password-reset' record
     * be appended to the route when using it.
     *
     * If `reset-password` is used as the value of the route, it is effectively
     * transformed into:
     *
     * * `GET` ---> `reset-password/:id`
     * * `POST` ---> `reset-password/:id`
     */
    resetPassword: z.string().endsWith('/:id'),
  }),

  /**
   * This configuration block defines the various callbacks pertaining to
   * the password-reset feature(s) used across this module.
   */
  callback: z.object({
    /**
     * This callback is used to resolve the user associated to the username
     * provided in the 'forgot-password' request.
     *
     * It accepts the username of the user for whom the password needs to be
     * reset; and returns the resolved user instance if found, and throws
     * otherwise.
     *
     * e.g.:
     * ```
     * (username: string) => { return User(...); };
     * ```
     */
    resolveUser: z.function().args(z.string()).returns(z.promise(z.unknown())),

    /**
     * This callback defines how the user's password-reset request is confirmed
     * through a notification channel - by email or otherwise.
     * It can also define any additional actions that need to be done after the
     * resolution of the associated user, and the creation of the
     * 'password-reset' record.
     *
     * It accepts the previously resolved user instance, and the newly
     * created 'password-reset' instance.
     *
     * It will typically be used to send a 'forgot-password' email to the
     * associated user.
     *
     * e.g.:
     * ```
     * (user: User, passwordReset: PasswordReset) => { ... };
     * ```
     */
    notifyUser: z
      .function()
      .args(z.any(), z.any())
      .returns(z.promise(z.void())),

    /**
     * This callback is used to retrieve a 'password-reset' record from the
     * database.
     *
     * It accepts the 'id' of the 'password-reset' record; and returns the
     * resolved 'password-reset' record if found, and throws otherwise.
     *
     * e.g.:
     * ```
     * (id: string) => { return PasswordReset(...); };
     * ```
     */
    retrievePasswordReset: z
      .function()
      .args(z.string())
      .returns(z.promise(z.unknown())),

    /**
     * This callback is used to create a 'password-reset' record in the
     * database.
     *
     * It accepts a user instance, and returns the newly created
     * 'password-reset' record.
     *
     * e.g.:
     * ```
     * async (user: User) => { return await PasswordReset(...); };
     * ```
     */
    createPasswordReset: z
      .function()
      .args(z.any())
      .returns(z.promise(z.unknown())),

    /**
     * This callback is used to delete the 'password-reset' record from the
     * database.
     *
     * It accepts the 'id' of the 'password-reset' record to delete.
     *
     * e.g.:
     * ```
     * async (id: string) => { await ... };
     * ```
     */
    deletePasswordReset: z
      .function()
      .args(z.string())
      .returns(z.promise(z.void())),

    /**
     * This callback defines how the password of the associated user
     * is reset.
     *
     * It accepts the associated 'password-reset' instance, as well as the new
     * password.
     *
     * e.g.:
     * ```
     * (passwordReset: PasswordReset, newPassword: string) => { ... };
     * ```
     */
    resetUserPassword: z
      .function()
      .args(z.any(), z.string())
      .returns(z.promise(z.void())),
  }),
});

export type PasswordResetModuleOptions = z.infer<
  typeof passwordResetModuleOptionsValidationSchema
>;
