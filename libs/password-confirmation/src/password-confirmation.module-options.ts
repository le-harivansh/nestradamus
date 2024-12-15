import { z } from 'zod';

export const passwordConfirmationModuleOptionsValidationSchema = z.object({
  /**
   * This is the route where the user password in the form of a POST
   * request with a body having the shape:
   * `{ "password": "***" }`
   * is sent to be validated against the stored user's password.
   */
  route: z.string().min(1),

  /**
   * This bolck defines the "password-confirmation" specific cookie configuration.
   */
  cookie: z.object({
    /**
     * The name of the "password-confirmation" cookie.
     */
    name: z.string().min(4),

    /**
     * The duration (in seconds) for which the "password-confirmation" cookie
     * is valid.
     */
    expiresInSeconds: z.number().safe().positive(),
  }),

  /**
   * This configuration block defines the various callbacks pertaining to:
   * credentials-validation, cookie-payload creation & validation, user resolution,
   * amongst others; that is used in this module.
   */
  callback: z.object({
    /**
     * This block defines the user-specific callbacks.
     */
    user: z.object({
      /**
       * The callback that is used to retrieve the authenticated user instance
       * from the current request.
       *
       * It is assumed that the authenticated user is stored in the express Request
       * object - as is the norm for nodejs web applications.
       *
       * e.g.:
       * ```
       * (request: Request) => request.user,
       * ```
       */
      retrieveFromRequest: z.function().args(z.any()).returns(z.unknown()),

      /**
       * The callback that is used to verify whether the provided password is
       * valid.
       *
       * It accepts the resolved user instance, and the passed-in "password", and
       * returns true if the validation is successful, and false otherwise.
       *
       * e.g.:
       * ```
       * async (user: User, password: string) => { return await validate(user.email, password); }
       * ```
       */
      validatePassword: z
        .function()
        .args(z.any(), z.string())
        .returns(z.promise(z.boolean())),
    }),

    /**
     * This block defines the cookie-specific callbacks.
     */
    cookie: z.object({
      /**
       * The callback used to create the cookie-payload.
       *
       * It accepts a "user" instance, and returns the cookie string.
       *
       * e.g.:
       * ```
       * async (user: User) => { return await hash(user.password); }
       * ```
       */
      createPayload: z.function().args(z.any()).returns(z.promise(z.string())),

      /**
       * The callback used to validate the password-confirmation cookie string.
       *
       * It accepts a "user" instance and the previously created
       * password-confirmation cookie string, and returns `true` if it is
       * valid, and `false` otherwise.
       *
       * e.g.:
       * ```
       * async (user: User, cookiePayload: string) => { return await verify(cookiePayload, user.password); }
       * ```
       */
      validatePayload: z
        .function()
        .args(z.any(), z.string())
        .returns(z.promise(z.boolean())),
    }),
  }),
});

export type PasswordConfirmationModuleOptions = z.infer<
  typeof passwordConfirmationModuleOptionsValidationSchema
>;
