import { INestApplication } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { verify } from 'argon2';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Model } from 'mongoose';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';

import { Otp, OtpDocument, OtpSchema } from '../schema/otp.schema';
import type { OtpTypeName } from '../type';
import { OtpService } from './otp.service';

jest.mock('@/_application/_logger/service/winston-logger.service');

type OtpData = { type: OtpTypeName; destination: string; ttlSeconds: number };

describe(OtpService.name, () => {
  let application: INestApplication;
  let mongoMemoryServer: MongoMemoryServer;

  let loggerService: jest.Mocked<WinstonLoggerService>;
  let otpService: OtpService;

  let otpModel: Model<Otp>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRootAsync({
          async useFactory() {
            mongoMemoryServer = await MongoMemoryServer.create();

            return { uri: mongoMemoryServer.getUri() };
          },
        }),
        MongooseModule.forFeature([{ name: Otp.name, schema: OtpSchema }]),
      ],
      providers: [WinstonLoggerService, OtpService],
    }).compile();

    application = moduleFixture.createNestApplication();
    loggerService = application.get(WinstonLoggerService);
    otpService = application.get(OtpService);

    otpModel = application.get<Model<Otp>>(getModelToken(Otp.name));

    await application.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();

    await otpModel.deleteMany();
  });

  afterAll(async () => {
    await application.close();
    await mongoMemoryServer.stop();
  });

  it('should be defined', () => {
    expect(otpService).toBeDefined();
  });

  describe('generateNumericPassword', () => {
    it('returns a numeric string of the specified length', () => {
      const passwordLength = 8;

      expect(OtpService.generateNumericPassword(passwordLength)).toMatch(
        new RegExp(`^[0-9]{${passwordLength}}$`),
      );
    });
  });

  describe('create', () => {
    const otpData: OtpData = {
      type: 'user.registration',
      destination: 'user@email.com',
      ttlSeconds: 1 * 60,
    };

    let createdOtp: OtpDocument;

    beforeEach(async () => {
      createdOtp = await otpService.create(
        otpData.type,
        otpData.destination,
        otpData.ttlSeconds,
      );
    });

    it('saves a new OTP document to the database', async () => {
      await expect(
        otpModel
          .findOne({
            type: otpData.type,
            destination: otpData.destination,
          })
          .exec(),
      ).resolves.toMatchObject({
        type: otpData.type,
        destination: otpData.destination,
      });
    });

    it('returns an OTP document with the provided cleartext password', () => {
      expect(createdOtp.get('password')).toMatch(
        new RegExp(`^[0-9]{${OtpService.PASSWORD_LENGTH}}$`),
      );
    });

    it('hashes the password of the OTP document before saving it to the database', async () => {
      const retrievedOtpDocument = await otpModel
        .findById(createdOtp._id)
        .exec();

      await expect(
        verify(
          retrievedOtpDocument!.get('password'),
          createdOtp.get('password'),
        ),
      ).resolves.toBe(true);
    });

    it('logs the OTP creation data', () => {
      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Created new OTP',
        createdOtp,
      );
    });
  });

  describe('isValid', () => {
    const otpData: OtpData = {
      type: 'user.registration',
      destination: 'user-1@email.com',
      ttlSeconds: 1 * 60,
    };

    let otp: OtpDocument;

    beforeEach(async () => {
      otp = await otpService.create(
        otpData.type,
        otpData.destination,
        otpData.ttlSeconds,
      );

      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('returns true if at least one OTP document matches the specified criteria and the password is valid', async () => {
      const validationResult = await otpService.isValid(otp.get('password'), {
        type: otp.get('type'),
        destination: otp.get('destination'),
      });

      expect(validationResult).toBe(true);
    });

    it('logs data about the OTP matching', async () => {
      await otpService.isValid(otp.get('password'), {
        type: otp.get('type'),
        destination: otp.get('destination'),
      });

      expect(loggerService.log).toHaveBeenCalledTimes(3);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Found at least 1 matching OTP',
        {
          type: otp.get('type'),
          destination: otp.get('destination'),
        },
      );
    });

    it('logs data when the OTP validation state is truthy', async () => {
      await otpService.isValid(otp.get('password'), {
        type: otp.get('type'),
        destination: otp.get('destination'),
      });

      expect(loggerService.log).toHaveBeenCalledTimes(3);
      expect(loggerService.log).toHaveBeenCalledWith('OTP is valid', {
        type: otp.get('type'),
        destination: otp.get('destination'),
      });
    });

    it('deletes an OTP if it has been validated', async () => {
      const validationResult = await otpService.isValid(otp.get('password'), {
        type: otp.get('type'),
        destination: otp.get('destination'),
      });

      expect(validationResult).toBe(true);
      await expect(otpModel.findById(otp._id).exec()).resolves.toBeNull();
    });

    it('deletes any other OTP matching the same context for the specified destination', async () => {
      await Promise.all(
        [...Array(3)].map(() =>
          otpService.create(
            otpData.type,
            otpData.destination,
            otpData.ttlSeconds,
          ),
        ),
      );

      const validationResult = await otpService.isValid(otp.get('password'), {
        type: otp.get('type') as OtpTypeName,
        destination: otp.get('destination'),
      });

      expect(validationResult).toBe(true);

      const hasAtLeastOneMatchingOtp =
        (await otpModel
          .findOne({
            type: otpData.type,
            destination: otpData.destination,
          })
          .exec()) !== null;

      expect(hasAtLeastOneMatchingOtp).toBe(false);
    });

    it('logs data about deleting the matched OTPs', async () => {
      await otpService.isValid(otp.get('password'), {
        type: otp.get('type'),
        destination: otp.get('destination'),
      });

      expect(loggerService.log).toHaveBeenCalledTimes(3);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Deleted all 1 OTP(s) matching',
        {
          type: otp.get('type'),
          destination: otp.get('destination'),
        },
      );
    });

    it('returns false if the OTP documents matching the specified criteria fail the password validation test', async () => {
      const validationResult = await otpService.isValid('wrong-password', {
        type: otp.get('type'),
        destination: otp.get('destination'),
      });

      expect(validationResult).toBe(false);
    });

    it('returns false if there are no matching OTP documents', async () => {
      const validationResult = await otpService.isValid('123456', {
        type: 'non-existent-type' as OtpTypeName,
        destination: 'non-existent@email.com',
      });

      expect(validationResult).toBe(false);
    });

    it('logs data when the OTP validation state is falsy', async () => {
      await otpService.isValid('123456', {
        type: 'non-existent-type' as OtpTypeName,
        destination: 'non-existent@email.com',
      });

      expect(loggerService.log).toHaveBeenCalledTimes(2);
      expect(loggerService.log).toHaveBeenCalledWith('OTP is not valid', {
        type: 'non-existent-type',
        destination: 'non-existent@email.com',
      });
    });
  });
});
