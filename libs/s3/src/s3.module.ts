import {
  HeadBucketCommand,
  S3Client,
  S3ClientConfig,
} from '@aws-sdk/client-s3';
import {
  DynamicModule,
  Inject,
  InternalServerErrorException,
  Module,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';

import { S3_CLIENT } from './constant';
import {
  S3_MODULE_ASYNC_OPTIONS_TYPE,
  S3_MODULE_OPTIONS_TOKEN,
  S3ConfigurableModuleClass,
} from './s3.module-definition';
import {
  S3ModuleOptions,
  s3ModuleOptionsValidationSchema,
} from './s3.module-options';
import { S3Service } from './service/s3.service';

@Module({})
export class S3Module
  extends S3ConfigurableModuleClass
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  constructor(
    @Inject(S3_MODULE_OPTIONS_TOKEN)
    private readonly s3ModuleOptions: S3ModuleOptions,
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
  ) {
    super();

    // Validate the configuration object passed to the module.
    s3ModuleOptionsValidationSchema.parse(this.s3ModuleOptions);
  }

  async onApplicationBootstrap() {
    try {
      // Check if the specified bucket exists & can be reached.
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.s3ModuleOptions.aws.bucketName }),
      );
    } catch {
      throw new InternalServerErrorException(
        'Could not initialize the S3 bucket.',
      );
    }
  }

  onApplicationShutdown() {
    this.s3Client.destroy();
  }

  static forRootAsync(
    options: typeof S3_MODULE_ASYNC_OPTIONS_TYPE,
  ): DynamicModule {
    const {
      providers = [],
      exports = [],
      ...dynamicModuleOptions
    } = super.forRootAsync(options);

    return {
      ...dynamicModuleOptions,

      providers: [
        ...providers,

        {
          provide: S3_CLIENT,
          inject: [S3_MODULE_OPTIONS_TOKEN],
          useFactory: (s3ModuleOptions: S3ModuleOptions): S3Client => {
            const endpointConfig: Pick<S3ClientConfig, 'endpoint'> =
              s3ModuleOptions.aws.endpoint
                ? { endpoint: s3ModuleOptions.aws.endpoint }
                : {};

            return new S3Client({
              credentials: {
                accessKeyId: s3ModuleOptions.aws.credentials.accessKey,
                secretAccessKey: s3ModuleOptions.aws.credentials.secretKey,
              },

              region: s3ModuleOptions.aws.region,

              ...endpointConfig,
            });
          },
        },

        S3Service,
      ],

      exports: [...exports, S3Service],
    };
  }
}
