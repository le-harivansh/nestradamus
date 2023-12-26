import { registerAs } from '@nestjs/config';
import { env } from 'node:process';
import { z } from 'zod';

export const CONFIGURATION_NAMESPACE = 'mail';

const mailConfigurationValidationSchema = z.object({
  host: z.string().default('localhost'),
  port: z.coerce.number().int().positive().max(65535).default(1025),
  default: z.object({
    from: z.string().email(),
  }),
});

export type MailConfiguration = z.infer<
  typeof mailConfigurationValidationSchema
>;

export default registerAs(CONFIGURATION_NAMESPACE, () =>
  mailConfigurationValidationSchema.parse({
    host: env.MAIL_SMTP_HOST,
    port: env.MAIL_SMTP_PORT,
    default: {
      from: env.MAIL_FROM_ADDRESS,
    },
  }),
);
