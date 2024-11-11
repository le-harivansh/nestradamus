import { RequestMethod } from '@nestjs/common';
import { z } from 'zod';

/**
 * This object provides the schema for validating a "route" which is used when
 * configuring the authentication middleware.
 */
const routeValidationSchema = z.array(
  z.union([
    /**
     * Route can be a string.
     */
    z.string(),

    /**
     * Route can be a `RouteInfo`.
     */
    z.object({ path: z.string(), method: z.nativeEnum(RequestMethod) }),
  ]),
);

export const authenticationModuleOptionsValidationSchema = z.object({
  /**
   * This configuration block defines the authentication routes of the module.
   */
  route: z.object({
    /**
     * This is the route where the user credentials in the form of a POST
     * request with a body having the shape:
     * `{ "username": "...", "password": "***" }`
     * is sent to "login" / "authenticate" the user.
     *
     * A DELETE request can also be used on this route to "logout" / "de-authenticate" the user.
     */
    login: z.string().min(1),

    /**
     * This is the route where the user password in the form of a POST
     * request with a body having the shape:
     * `{ "password": "***" }`
     * is sent to be validated against the stored user's password.
     */
    passwordConfirmation: z.string().min(1),

    /**
     * This configuration block defines the "token-refresh" routes of the
     * module.
     */
    tokenRefresh: z.object({
      /**
       * This route refreshes the "access-token" of the user.
       * A "refresh-token is needed to access this route.
       */
      accessToken: z.string().min(1),

      /**
       * This route refreshes the "refresh-token" of the user.
       * An "access-token" is needed to access this route.
       */
      refreshToken: z.string().min(1),
    }),
  }),

  /**
   * This block defines the configuration options for the authentication
   * middleware in the application.
   */
  middleware: z.object({
    /**
     * This configuration block defines the routes for which the "access-token"
     * middleware is applied to.
     *
     * The routes for which this middleware is active on requires the request to
     * have an "access-token" present in it.
     */
    requiresAccessToken: z.object({
      /**
       * The routes for which the "access-token" middleware is applied to.
       *
       * Note: The "refresh refresh-token" route is automatically included.
       */
      forRoutes: routeValidationSchema.nonempty(),

      /**
       * The routes for which the "access-token" middleware should not be
       * applied to.
       *
       * Note: The "login" & "refresh access-token" routes are automatically
       * excluded.
       */
      except: routeValidationSchema,
    }),
  }),

  /**
   * This property refers to the name of the property - on the request object -
   * which holds the resolved authenticated user object.
   */
  requestPropertyHoldingAuthenticatedUser: z.string().min(4),

  /**
   * This configuration block defines the JWT configuration which is used to
   * generate the "access-token" and "refresh-token" used within this
   * module.
   *
   * The properties are similar to those defined in the package:
   * https://github.com/auth0/node-jsonwebtoken
   */
  jwt: z.object({
    algorithm: z.enum(['HS512', 'RS512', 'ES512', 'PS512']),
    issuer: z.string().min(1),
    audience: z.string().min(1),
    secret: z.string().min(64),
  }),

  /**
   * This block defines the cookie-specific configuration options.
   */
  cookie: z.object({
    /**
     * This bolck defines the "password-confirmation" specific configuration.
     */
    passwordConfirmation: z.object({
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
     * This block defines the "access-token" specific configuration.
     */
    accessToken: z.object({
      /**
       * The name of the "access-token" cookie.
       */
      name: z.string().min(4),

      /**
       * The duration (in seconds) for which the "access-token" cookie is
       * valid.
       */
      expiresInSeconds: z.number().safe().positive(),
    }),

    /**
     * This block defines the "refresh-token" specific configuration.
     */
    refreshToken: z.object({
      /**
       * The name of the "refresh-token" cookie.
       */
      name: z.string().min(4),

      /**
       * The duration (in seconds) for which the "refresh-token" cookie is
       * valid.
       */
      expiresInSeconds: z.number().safe().positive(),
    }),
  }),

  /**
   * This configuration block defines the various callbacks pertaining to:
   * credentials-validation, JWT-creation & validation, user resolution,
   * amongst others; that is used in this module.
   */
  callback: z.object({
    /**
     * The callback that is used to retrieve a user according to its "username".
     *
     * It accepts the username, and returs the resolved user instance if found,
     * and `null` otherwise.
     *
     * e.g.:
     * ```
     * async (username: string) => { return await userService.findByUsername(username); }
     * ```
     */
    retrieveUser: z
      .function()
      .args(z.string())
      .returns(z.promise(z.unknown().nullable())),

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

    /**
     * This block defines the "password-confirmation" specific callbacks.
     */
    passwordConfirmation: z.object({
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
      createCookiePayload: z
        .function()
        .args(z.any())
        .returns(z.promise(z.string())),

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
      validateCookiePayload: z
        .function()
        .args(z.any(), z.string())
        .returns(z.promise(z.boolean())),
    }),

    /**
     * This block defines the "access-token" specific callbacks.
     */
    accessToken: z.object({
      /**
       * The callback used to create the JWT payload.
       *
       * It accepts a "user" instance, and returns the JWT payload object.
       *
       * e.g.:
       * ```
       * async (user: User) => ({ id: ..., exp: ... });
       * ```
       */
      createJwtPayload: z
        .function()
        .args(z.any())
        .returns(z.promise(z.record(z.unknown()))),

      /**
       * The callback used to validate the JWT payload.
       *
       * It accepts the resolved JWT payload, and returns `true` if it is valid,
       * and `false` otherwise.
       *
       * e.g.:
       * ```
       * async (payload: Record<string, string>) => { return await validatePayload(payload) };
       * ```
       */
      validateJwtPayload: z
        .function()
        .args(z.record(z.unknown()))
        .returns(z.promise(z.boolean())),

      /**
       * The callback that used to resolve the authenticated user from the data
       * stored in the JWT payload.
       *
       *
       * It should accept the JWT payload, and return the resolved user instance
       * or `null` if a user could not be resolved.
       *
       * e.g.:
       * ```
       * async (payload: Record<string, string>) => { return await userRepository.findById(payload.id); }
       * ```
       */
      resolveUserFromJwtPayload: z
        .function()
        .args(z.record(z.unknown()))
        .returns(z.promise(z.unknown())),
    }),

    /**
     * This block defines the "refresh-token" specific callbacks.
     */
    refreshToken: z.object({
      /**
       * The callback that is used to create the JWT payload.
       *
       * It should accept a "user" instance, and return the JWT payload object.
       *
       * e.g.:
       * ```
       * async (user: any) => ({ id: ..., exp: ... });
       * ```
       */
      createJwtPayload: z
        .function()
        .args(z.any())
        .returns(z.promise(z.record(z.unknown()))),

      /**
       * The callback used to validate the JWT payload.
       *
       * It accepts the resolved JWT payload, and returns `true` if it is valid,
       * and `false` otherwise.
       *
       * e.g.:
       * ```
       * async (payload: Record<string, string>) => { return await validatePayload(payload) };
       * ```
       */
      validateJwtPayload: z
        .function()
        .args(z.record(z.unknown()))
        .returns(z.promise(z.boolean())),

      /**
       * The callback that used to resolve the authenticated user from the data
       * stored in the JWT payload.
       *
       *
       * It should accept the JWT payload, and return the resolved user instance
       * or `null` if a user could not be resolved.
       *
       * e.g.:
       * ```
       * async (payload: Record<string, string>) => { return await userRepository.findById(payload.id); }
       * ```
       */
      resolveUserFromJwtPayload: z
        .function()
        .args(z.record(z.unknown()))
        .returns(z.promise(z.unknown())),
    }),
  }),
});

export type AuthenticationModuleOptions = z.infer<
  typeof authenticationModuleOptionsValidationSchema
>;
