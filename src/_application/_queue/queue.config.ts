import { registerAs } from '@nestjs/config';
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
    prefix: process.env.QUEUE_PREFIX,
    redis: {
      host: process.env.QUEUE_REDIS_HOST,
      port: process.env.QUEUE_REDIS_PORT,
    },
  }),
);
