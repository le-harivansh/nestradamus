import { z } from 'zod';

export const databaseModuleOptionsValidationSchema = z.object({
  /**
   * The host of the mongoDB database.
   */
  host: z.string().min(1),

  /**
   * The port where it is reachable from.
   */
  port: z.coerce.number().int().positive().max(65535),

  /**
   * The username of the user that can do operations on the specified database.
   */
  username: z.string().min(1),

  /**
   * The password of the user that can do operations on the specified database.
   */
  password: z.string().min(1),

  /**
   * The name of the database.
   */
  databaseName: z.string().min(1),

  /**
   * The name of the application that appears for the connections to mongoDB
   * in the mongoDB log.
   */
  applicationName: z.string().min(1),
});

export type DatabaseModuleOptions = z.infer<
  typeof databaseModuleOptionsValidationSchema
>;
