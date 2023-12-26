import { registerAs } from '@nestjs/config';
import { env } from 'node:process';
import { z } from 'zod';

export const CONFIGURATION_NAMESPACE = 'database';

const databaseConfigurationValidationSchema = z.object({
  host: z.string().default('localhost'),
  port: z.coerce.number().int().positive().max(65535).default(27017),
  username: z.string().default('application'),
  password: z.string().default('application'),
  name: z.string().default('application'),
});

export type DatabaseConfiguration = z.infer<
  typeof databaseConfigurationValidationSchema
>;

export default registerAs(CONFIGURATION_NAMESPACE, () =>
  databaseConfigurationValidationSchema.parse({
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    username: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD,
    name: env.DATABASE_NAME,
  }),
);
