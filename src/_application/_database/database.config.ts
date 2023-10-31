import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const CONFIGURATION_NAMESPACE = 'database';

const databaseConfigurationValidationSchema = z.object({
  host: z.string().default('localhost'),
  port: z.coerce.number().int().positive().max(65535).default(27017),
  username: z.string().default('superapp'),
  password: z.string().default('superapp'),
  name: z.string().default('superapp'),
});

export type DatabaseConfiguration = z.infer<
  typeof databaseConfigurationValidationSchema
>;

export default registerAs(CONFIGURATION_NAMESPACE, () =>
  databaseConfigurationValidationSchema.parse({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT as unknown as number,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    name: process.env.DATABASE_NAME,
  } as DatabaseConfiguration),
);
