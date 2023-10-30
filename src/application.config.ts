import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const CONFIGURATION_NAMESPACE = 'application';

const applicationConfigurationValidationSchema = z.object({
  environment: z
    .union([
      z.literal('test'),
      z.literal('development'),
      z.literal('production'),
    ])
    .default('development'),
  name: z.string().default('Super-App'),
  port: z.coerce.number().int().positive().max(65535).default(3000),
  'rate-limiter': z.object({
    ttl: z.coerce.number().int().positive().default(60),
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
    port: process.env.APPLICATION_PORT as unknown as number,
    'rate-limiter': {
      ttl: process.env.APPLICATION_THROTTLER_TTL_SECONDS as unknown as number,
      limit: process.env.APPLICATION_THROTTLER_LIMIT as unknown as number,
    },
  } as ApplicationConfiguration),
);
