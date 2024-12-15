import { registerAs } from '@nestjs/config';
import { env } from 'node:process';
import { z } from 'zod';

export const CONFIGURATION_NAMESPACE = 'throttling';

const throttlingConfigurationValidationSchema = z.object({
  default: z.object({
    ttlSeconds: z.coerce.number().int().safe().positive(),
    limit: z.coerce.number().int().safe().positive(),
  }),
});

export type ThrottlingConfiguration = z.infer<
  typeof throttlingConfigurationValidationSchema
>;

export default registerAs(CONFIGURATION_NAMESPACE, () =>
  throttlingConfigurationValidationSchema.parse({
    default: {
      ttlSeconds: env['THROTTLING_DEFAULT_TTL_SECONDS'],
      limit: env['THROTTLING_DEFAULT_LIMIT'],
    },
  }),
);
