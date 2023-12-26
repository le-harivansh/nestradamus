import { registerAs } from '@nestjs/config';
import { env } from 'node:process';
import { z } from 'zod';

export const CONFIGURATION_NAMESPACE = 'queue';

const queueConfigurationValidationSchema = z.object({
  prefix: z.string().default('application.queue:'),
  redis: z.object({
    host: z.string().default('localhost'),
    port: z.coerce.number().int().positive().max(65535).default(1025),
  }),
});

export type QueueConfiguration = z.infer<
  typeof queueConfigurationValidationSchema
>;

export default registerAs(CONFIGURATION_NAMESPACE, () =>
  queueConfigurationValidationSchema.parse({
    prefix: env.QUEUE_PREFIX,
    redis: {
      host: env.QUEUE_REDIS_HOST,
      port: env.QUEUE_REDIS_PORT,
    },
  }),
);
