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
  port: z.coerce.number().positive().default(3000),
});

export type ApplicationConfiguration = z.infer<
  typeof applicationConfigurationValidationSchema
>;

export default registerAs(CONFIGURATION_NAMESPACE, () =>
  applicationConfigurationValidationSchema.parse({
    environment: process.env.NODE_ENV,
    port: process.env.APPLICATION_PORT,
  }),
);
