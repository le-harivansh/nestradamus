import { registerAs } from '@nestjs/config';
import { env } from 'node:process';
import { z } from 'zod';

export const CONFIGURATION_NAMESPACE = 'mail';

const mailConfigurationValidationSchema = z.object({
  host: z.string(),
  port: z.coerce.number().int().positive().max(65535),
  authentication: z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  }),
  default: z.object({
    from: z.object({
      name: z.string().min(1),
      address: z.string().email(),
    }),
  }),
});

export type MailConfiguration = z.infer<
  typeof mailConfigurationValidationSchema
>;

export default registerAs(CONFIGURATION_NAMESPACE, () =>
  mailConfigurationValidationSchema.parse({
    host: env['MAIL_HOST'],
    port: env['MAIL_PORT'],
    authentication: {
      username: env['MAIL_USERNAME'],
      password: env['MAIL_PASSWORD'],
    },
    default: {
      from: {
        name: env['MAIL_DEFAULT_FROM_NAME'],
        address: env['MAIL_DEFAULT_FROM_ADDRESS'],
      },
    },
  }),
);
