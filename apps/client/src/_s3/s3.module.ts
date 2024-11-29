import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { S3Module as S3LibraryModule } from '@library/s3';

import { ConfigurationService } from '../_configuration/service/configuration.service';
import s3Configuration from './s3.config';

@Module({
  imports: [
    ConfigModule.forFeature(s3Configuration),

    S3LibraryModule.forRootAsync({
      inject: [ConfigurationService],
      useFactory: (configurationService: ConfigurationService) => ({
        aws: {
          credentials: {
            accessKey: configurationService.getOrThrow(
              's3.aws.credentials.accessKey',
            ),
            secretKey: configurationService.getOrThrow(
              's3.aws.credentials.secretKey',
            ),
          },
          region: configurationService.getOrThrow('s3.aws.region'),
          bucketName: configurationService.getOrThrow('s3.aws.bucketName'),
          endpoint: ['development', 'test'].includes(
            configurationService.getOrThrow('application.environment'),
          )
            ? configurationService.getOrThrow('s3.aws.endpoint.development')
            : undefined,
        },
      }),

      isGlobal: true,
    }),
  ],
})
export class S3Module {}
