import { registerAs } from '@nestjs/config';
import { z } from 'zod';

import { MS_DURATION_PATTERN } from '../_authentication/helper';

export const CONFIGURATION_NAMESPACE = 'application';

const applicationConfigurationValidationSchema = z.object({
  environment: z
    .union([
      z.literal('test'),
      z.literal('development'),
      z.literal('production'),
    ])
    .default('development'),
  name: z.string().default('Application'),
  port: z.coerce.number().int().positive().max(65535).default(3000),
  'rate-limiter': z.object({
    ttl: z.string().regex(MS_DURATION_PATTERN).default('1 minute'),
    limit: z.coerce.number().int().positive().default(5),
  }),
});

export type ApplicationConfiguration = z.infer<
  typeof applicationConfigurationValidationSchema
>;

export default registerAs(CONFIGURATION_NAMESPACE, () =>
  applicationConfigurationValidationSchema.parse({
    environment: process.env.NODE_ENV,
    name: process.env.APPLICATION_NAME,
    port: process.env.APPLICATION_PORT,
    'rate-limiter': {
      ttl: process.env.APPLICATION_THROTTLER_TTL,
      limit: process.env.APPLICATION_THROTTLER_REQUEST_LIMIT,
    },
  } as ApplicationConfiguration),
);
