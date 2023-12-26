import { registerAs } from '@nestjs/config';
import ms from 'ms';
import { env } from 'node:process';
import { z } from 'zod';

import { MS_DURATION_PATTERN } from '@/_library/constant';

export const CONFIGURATION_NAMESPACE = 'application';

const applicationConfigurationValidationSchema = z.object({
  environment: z
    .union([
      z.literal('test'),
      z.literal('development'),
      z.literal('production'),
    ])
    .default('development'),
  name: z
    .string()
    .regex(/^[a-z0-9_-]+$/i)
    .default('Application'),
  port: z.coerce.number().int().positive().max(65535).default(3000),
  rateLimiter: z.object({
    ttl: z
      .string()
      .regex(MS_DURATION_PATTERN)
      .default('1 minute')
      .transform(ms),
    limit: z.coerce.number().int().positive().default(5),
  }),
});

export type ApplicationConfiguration = z.infer<
  typeof applicationConfigurationValidationSchema
>;

export default registerAs(CONFIGURATION_NAMESPACE, () =>
  applicationConfigurationValidationSchema.parse({
    environment: env.NODE_ENV,
    name: env.APPLICATION_NAME,
    port: env.APPLICATION_PORT,
    rateLimiter: {
      ttl: env.APPLICATION_THROTTLER_TTL,
      limit: env.APPLICATION_THROTTLER_REQUEST_LIMIT,
    },
  }),
);
