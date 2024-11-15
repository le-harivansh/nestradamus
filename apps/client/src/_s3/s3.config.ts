import { registerAs } from '@nestjs/config';
import { env } from 'node:process';
import { z } from 'zod';

export const CONFIGURATION_NAMESPACE = 's3';

const s3ConfigurationValidationSchema = z.object({
  aws: z.object({
    credentials: z.object({
      accessKey: z.string().min(1),
      secretKey: z.string().min(1),
    }),

    region: z.string().min(1),
    bucketName: z.string().min(1),

    endpoint: z.object({
      development: z.string().url(),
    }),
  }),
});

export type S3Configuration = z.infer<typeof s3ConfigurationValidationSchema>;

export default registerAs(CONFIGURATION_NAMESPACE, () =>
  s3ConfigurationValidationSchema.parse({
    aws: {
      credentials: {
        accessKey: env['S3_ACCESS_KEY'],
        secretKey: env['S3_SECRET_KEY'],
      },

      region: env['S3_REGION'],
      bucketName: env['S3_BUCKET_NAME'],

      endpoint: {
        development: env['S3_DEVELOPMENT_ENDPOINT'],
      },
    },
  }),
);
