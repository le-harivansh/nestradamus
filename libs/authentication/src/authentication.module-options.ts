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
     * is sent to login/authenticate the user.
     *
     * A DELETE request can also be used on this route to "logout" / "de-authenticate" the user.
     */
    login: z.string().min(1),

    /**
     * This configuration block defines the "token-refresh" routes of the
     * module.
     */
    tokenRefresh: z.object({
      /**
       * This route is used to refresh the "access-token" of the user.
       * A "refresh-token is needed to access this route.
       */
      accessToken: z.string().min(1),

      /**
       * This route is used to refresh the "refresh-token" of the user.
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
     * This block defines the "access-token" specific configurations.
     */
    accessToken: z.object({
      /**
       * The name of the cookie which will hold the "access-token".
       */
      name: z.string().min(4),

      /**
       * The duration (in seconds) for which the "access-token" cookie is
       * valid.
       */
      expiresInSeconds: z.number().safe().positive(),
    }),

    /**
     * This block defines the "refresh-token" specific configurations.
     */
    refreshToken: z.object({
      /**
       * The name of the cookie which will hold the "refresh-token".
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
     * The callback that is used to verify whether the passed-in username &
     * password are valid.
     *
     * It should accept the username & password passed-in through the request,
     * and return the resolved user instance if the validation is successful,
     * and `null` otherwise.
     *
     * e.g.:
     * ```
     * (username: string, password: string) => { return User(...); };
     * ```
     */
    validateCredentials: z
      .function()
      .args(z.string(), z.string())
      .returns(z.promise(z.unknown())),

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
       * (user: any) => ({ id: ..., exp: ... });
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
       * (payload: object) => injectedRepository.findById(payload.id);
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
       * (user: any) => ({ id: ..., exp: ... });
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
       * (payload: object) => injectedRepository.findById(payload.id);
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
