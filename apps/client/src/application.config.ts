import { registerAs } from '@nestjs/config';
import { env } from 'node:process';
import { z } from 'zod';

export const CONFIGURATION_NAMESPACE = 'application';

const applicationConfigurationValidationSchema = z.object({
  environment: z.union([
    z.literal('test'),
    z.literal('development'),
    z.literal('production'),
  ]),
  name: z.string().regex(/^[a-z0-9_-]+$/i),
  port: z.coerce.number().int().positive().max(65535),
  secret: z.string().min(64),
  frontendUrl: z.string().url(),
});

export type ApplicationConfiguration = z.infer<
  typeof applicationConfigurationValidationSchema
>;

export default registerAs(CONFIGURATION_NAMESPACE, () =>
  applicationConfigurationValidationSchema.parse({
    environment: env['NODE_ENV'],
    name: env['APPLICATION_NAME'],
    port: env['APPLICATION_PORT'],
    secret: env['APPLICATION_SECRET'],
    frontendUrl: env['FRONTEND_URL'],
  }),
);
