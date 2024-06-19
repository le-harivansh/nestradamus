import { RequestMethod } from '@nestjs/common';
import { z } from 'zod';

const routeInfoValidationSchema = z.array(
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
  routes: z.object({
    /**
     * This is the route where the user credentials in the form of a POST
     * request with a body having the shape:
     * `{ "username": "...", "password": "***" }`.
     *
     * A DELETE request can also be used on this route to "logout" the user.
     */
    login: z.string().min(1),

    /**
     * This configuration block defines the "token-refresh" routes of the
     * module.
     */
    refresh: z.object({
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
   * This configuration block defines the routes for which the "access-token"
   * middleware is applied to.
   *
   * This middleware requires the request to have an "access-token" present
   * in it.
   */
  authenticateUser: z.object({
    /**
     * The routes for which the "access-token" middleware is applied to.
     */
    forRoutes: routeInfoValidationSchema.nonempty(),

    /**
     * The routes for which the "access-token" middleware should not be
     * applied to.
     *
     * Note: The 'login' & 'refresh access-token' routes are automatically
     * excluded.
     */
    except: routeInfoValidationSchema,
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
   * This block defines the "access-token" specific configurations.
   */
  accessToken: z.object({
    /**
     * The name of the cookie which will hold the "access-token".
     */
    cookieName: z.string().min(4),

    /**
     * The duration (in seconds) for which the "access-token" and its
     * associated cookie are valid.
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
    cookieName: z.string().min(4),

    /**
     * The duration (in seconds) for which the "refresh-token" and its
     * associated cookie are valid.
     */
    expiresInSeconds: z.number().safe().positive(),
  }),

  /**
   * This configuration block defines the various callbacks pertaining to the
   * user-resolution, password-validation, and id-extraction required in this
   * module.
   */
  callbacks: z.object({
    /**
     * This configuration block defines the various ways through which an
     * authenticated user is retrieved.
     */
    resolveUser: z.object({
      /**
       * The callback that will be used to retrieve the user by its username.
       *
       * It should accept the "username" of the user to retrieve, and return
       * the resolved user instance or `null` if a user could not be resolved.
       *
       * e.g.:
       * ```
       * (username: string) => injectedRepository.findByUsername(username);
       * ```
       */
      byUsername: z
        .function()
        .args(z.string())
        .returns(z.promise(z.unknown().nullable())),

      /**
       * The callback that will be used to retrieve the user by its id.
       *
       *
       * It should accept the "id" of the user to retrieve, and return the
       * resolved user instance or `null` if a user could not be resolved.
       *
       * e.g.:
       * ```
       * (id: string) => injectedRepository.findById(id);
       * ```
       */
      byId: z
        .function()
        .args(z.string())
        .returns(z.promise(z.unknown().nullable())),
    }),

    /**
     * The callback that will be used to extract the id from a resolved `user`
     * instance.
     *
     * It should accept the resolved instance of a "user", and return its `id`
     * as a string.
     *
     * e.g.:
     * ```
     * (user: any) => '<user-id>';
     * ```
     */
    extractUserId: z.function().args(z.any()).returns(z.string()),

    /**
     * The callback that will be used to verify whether the passed-in password
     * is the same as the password of the current user being authenticated.
     *
     * It should accept the resolved instance of an authenticated "user" and the
     * password that needs to be validated, and return `true` if the validation
     * succeeds and `false` otherwise.
     *
     * e.g.:
     * ```
     * (user: any, password: string) => validate(user.password, password);
     * ```
     */
    validatePassword: z
      .function()
      .args(z.any(), z.string())
      .returns(z.promise(z.boolean())),
  }),
});

export type AuthenticationModuleOptions = z.infer<
  typeof authenticationModuleOptionsValidationSchema
>;
