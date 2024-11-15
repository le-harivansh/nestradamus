import { z } from 'zod';

export const s3ModuleOptionsValidationSchema = z.object({
  /**
   * This configuration block defines the AWS specific configuration of the
   * module.
   */
  aws: z.object({
    /**
     * This configuration block defines the credentials used to connect to the
     * S3 client.
     */
    credentials: z.object({
      /**
       * This is the S3 `access-key-id` for the IAM user that will be used to
       * connect, upload, & read files from the S3 client.
       */
      accessKey: z.string().min(1),

      /**
       * This is the S3 `secret-access-key-id` for the IAM user that will be
       * used to connect, upload, & read files from the S3 client.
       */
      secretKey: z.string().min(1),
    }),

    /**
     * This is the region of the S3 bucket that the S3 client will connect to.
     */
    region: z.string().min(1),

    /**
     * This is the name of the S3 bucket that the S3 client will connect to.
     */
    bucketName: z.string().min(1),

    /**
     * This is the custom endpoint to be used - if the user is not using the
     * default AWS endpoint - to connect to S3.
     *
     * It is typically used to allow for the user to connect to a local
     * S3-compatible service such as [MinIO](https://min.io).
     */
    endpoint: z.optional(z.string().url()),
  }),
});

export type S3ModuleOptions = z.infer<typeof s3ModuleOptionsValidationSchema>;
