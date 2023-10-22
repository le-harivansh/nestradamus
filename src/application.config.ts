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
});

export type ApplicationConfiguration = z.infer<
  typeof applicationConfigurationValidationSchema
>;

export default registerAs(CONFIGURATION_NAMESPACE, () =>
  applicationConfigurationValidationSchema.parse({
    environment: process.env.NODE_ENV,
    name: process.env.APPLICATION_NAME,
    port: parseInt(process.env.APPLICATION_PORT),
  } as ApplicationConfiguration),
);
