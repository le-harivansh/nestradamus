import { z } from 'zod';

export const mailModuleOptionsValidationSchema = z.object({
  /**
   * The hostname of the SMTP server.
   */
  host: z.string(),

  /**
   * The port of the SMTP server.
   */
  port: z.coerce.number().int().positive().max(65535),

  /**
   * This configuration block defines the authentication configuration of the
   * SMTP server.
   */
  authentication: z.object({
    /**
     * The username of the user using the SMTP server.
     */
    username: z.string().min(1),

    /**
     * The password of the user using the SMTP server.
     */
    password: z.string().min(1),
  }),

  /**
   * This configuration block defines the default configuration of the SMTP
   * server.
   */
  default: z.object({
    /**
     * This configuration block defines the default name & address of any e-mail
     * sent using this module.
     */
    from: z.object({
      /**
       * The name of the default sender.
       */
      name: z.string().min(1),

      /**
       * The e-mail address of the default sender.
       */
      address: z.string().email(),
    }),
  }),
});

export type MailModuleOptions = z.infer<
  typeof mailModuleOptionsValidationSchema
>;
