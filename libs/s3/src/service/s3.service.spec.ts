import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Test, TestingModule } from '@nestjs/testing';

import { S3_CLIENT } from '../constant';
import { S3_MODULE_OPTIONS_TOKEN } from '../s3.module-definition';
import { S3ModuleOptions } from '../s3.module-options';
import { S3Service } from './s3.service';

jest.mock('uuid', () => ({ v4: jest.fn().mockReturnValue('test-uuid-v4') }));
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('test-presigned-url'),
}));

describe(S3Service.name, () => {
  const s3ModuleOptions: S3ModuleOptions = {
    aws: {
      credentials: {
        accessKey: 'access-key',
        secretKey: 'secret-key',
      },
      region: 'unknown',
      bucketName: 'test-bucket',
    },
  };

  const s3Client = {
    send: jest.fn(),
  };

  let s3Service: S3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: S3_MODULE_OPTIONS_TOKEN,
          useValue: s3ModuleOptions,
        },
        {
          provide: S3_CLIENT,
          useValue: s3Client,
        },
        S3Service,
      ],
    }).compile();

    s3Service = module.get(S3Service);
  });

  it('should be defined', () => {
    expect(s3Service).toBeDefined();
  });

  describe(S3Service.prototype.uploadFile.name, () => {
    const keyPrefix = 'key/prefix';
    const file = {
      buffer: Buffer.from('test-file'),
      mimetype: 'text/plain',
    } as Express.Multer.File;

    let fileKey: string;

    beforeAll(async () => {
      fileKey = await s3Service.uploadFile(file, keyPrefix);
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it(`calls '${S3Client.name}::${S3Client.prototype.send.name}'`, () => {
      expect(s3Client.send).toHaveBeenCalledTimes(1);
    });

    it('returns the object-key of the newly stored file', () => {
      expect(fileKey).toBe(`${keyPrefix}/test-uuid-v4`);
    });
  });

  describe(S3Service.prototype.getPreSignedUrl.name, () => {
    const key = 'test/file/key';
    const expiresInSeconds = 30;

    let preSignedUrl: string;

    beforeAll(async () => {
      preSignedUrl = await s3Service.getPreSignedUrl(key, expiresInSeconds);
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it(`calls '${getSignedUrl.name}' with the specified ttl`, () => {
      expect(getSignedUrl).toHaveBeenCalledTimes(1);
      expect(getSignedUrl).toHaveBeenCalledWith(s3Client, expect.anything(), {
        expiresIn: expiresInSeconds,
      });
    });

    it(`returns the result of '${getSignedUrl.name}'`, () => {
      expect(preSignedUrl).toBe('test-presigned-url');
    });
  });
});
