import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';

import { S3_CLIENT } from '../constant';
import { S3_MODULE_OPTIONS_TOKEN } from '../s3.module-definition';
import { S3ModuleOptions } from '../s3.module-options';

@Injectable()
export class S3Service {
  private readonly bucketName: string;

  constructor(
    @Inject(S3_MODULE_OPTIONS_TOKEN) s3ModuleOptions: S3ModuleOptions,
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
  ) {
    this.bucketName = s3ModuleOptions.aws.bucketName;
  }

  async uploadFile(
    file: Express.Multer.File,
    keyPrefix: string,
  ): Promise<string> {
    const fileKey = `${keyPrefix}/${uuidv4()}`;
    const md5Hash = createHash('md5').update(file.buffer).digest('base64');

    const putObjectCommand = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentMD5: md5Hash,
    });

    await this.s3Client.send(putObjectCommand);

    return fileKey;
  }

  getPreSignedUrl(key: string, expiresInSeconds: number) {
    const getObjectCommand = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, getObjectCommand, {
      expiresIn: expiresInSeconds,
    });
  }
}
