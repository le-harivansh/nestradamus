import { z, ZodType } from 'zod';

import { PermissionsMap } from './type';

/**
 * This validator validates the shape of the callback of a permission.
 */
export const permissionCallbackValidator = z
  .function(z.tuple([]).rest(z.any()))
  .returns(z.union([z.boolean(), z.promise(z.boolean())]));

const permissionsMap: ZodType<PermissionsMap> = z.record(
  z.union([permissionCallbackValidator, z.lazy(() => permissionsMap)]),
);

export const authorizationModuleOptionsValidationSchema = z.object({
  /**
   * The validator to validate the shape of the permissions-map allowed by the
   * application.
   *
   * The object itself has the shape:
   *
   * ```
   * {
   *  user: {
   *    read: {
   *      own: () => true,
   *    },
   *
   *    update: {
   *      own: () => true,
   *    },
   *
   *    delete: {
   *      own: () => true,
   *    },
   *  },
   *
   *  task: {
   *    list: {
   *      own: () => true,
   *    },
   *
   *    create: () => true,
   *
   *    read: {
   *      own: async (
   *        authenticatedUser: WithId<User>,
   *        { taskId }: { taskId: string },
   *      ) => {
   *        const task = await taskService.find(new ObjectId(taskId));
   *
   *        return task.userId.equals(authenticatedUser._id);
   *      },
   *    },
   *
   *    update: {
   *      own: async (
   *        authenticatedUser: WithId<User>,
   *        { taskId }: { taskId: string },
   *      ) => {
   *        const task = await taskService.find(new ObjectId(taskId));
   *
   *        return task.userId.equals(authenticatedUser._id);
   *      },
   *    },
   *
   *    delete: {
   *      own: async (
   *        authenticatedUser: WithId<User>,
   *        { taskId }: { taskId: string },
   *      ) => {
   *        const task = await taskService.find(new ObjectId(taskId));
   *
   *        return task.userId.equals(authenticatedUser._id);
   *      },
   *    },
   *  }
   * ```
   */
  permissionsMap,

  /**
   * This is the string/character used to separate the different segments of a
   * permission string.
   *
   * e.g.: The permission-map:
   * ```
   * {
   *  user: {
   *    create: () => true,
   *  }
   * }
   * ```
   * with the permission-string separator ':' will yield the permission:
   * `user:create`.
   */
  permissionStringSeparator: z.string().max(1),

  /**
   * This block defines the callbacks used in this module.
   */
  callback: z.object({
    /**
     * This block defines user-centric callbacks.
     */
    user: z.object({
      /**
       * The callback used to retrieve the currently authenticated
       * user.
       */
      retrieveFromRequest: z
        .function()
        .args(z.any())
        .returns(z.union([z.unknown(), z.promise(z.unknown())])),

      /**
       * The callback used to retrieve the permissions from the authenticated user
       * instance.
       *
       * e.g.: `(user: WithId<User>) => user.permissions`
       */
      getPermissions: z
        .function()
        .args(z.any())
        .returns(
          z.union([z.array(z.string()), z.promise(z.array(z.string()))]),
        ),
    }),
  }),
});

export type AuthorizationModuleOptions = z.infer<
  typeof authorizationModuleOptionsValidationSchema
>;
