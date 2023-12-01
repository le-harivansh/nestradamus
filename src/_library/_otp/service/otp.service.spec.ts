import {
  INestApplication,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { verify } from 'argon2';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Model } from 'mongoose';

import { Otp, OtpDocument, OtpSchema } from '../schema/otp.schema';
import { OtpService } from './otp.service';

type OtpData = Pick<Otp, 'type' | 'destination'> & { ttlSeconds: number };

describe(OtpService.name, () => {
  let application: INestApplication;
  let mongoMemoryServer: MongoMemoryServer;

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
      providers: [OtpService],
    }).compile();

    application = moduleFixture.createNestApplication();
    otpService = application.get(OtpService);

    otpModel = application.get<Model<Otp>>(getModelToken(Otp.name));

    await application.init();
  });

  afterEach(async () => {
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
      const numericPassword =
        OtpService.generateNumericPassword(passwordLength);

      expect(numericPassword).toHaveLength(passwordLength);
      expect(numericPassword).toMatch(/^[0-9]+$/);
    });
  });

  describe('create', () => {
    const otpData: OtpData = {
      type: 'user:registration',
      destination: 'user@email.com',
      ttlSeconds: 1 * 60,
    };

    let newOtpDocument: OtpDocument;

    beforeEach(async () => {
      newOtpDocument = await otpService.create(
        otpData.type,
        otpData.destination,
        otpData.ttlSeconds,
      );
    });

    it('saves a new OTP document to the database', () => {
      expect(
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

    it('returns an OTP document with the provided cleartext password', async () => {
      const cleartextPassword = newOtpDocument.get('password');

      expect(cleartextPassword).toHaveLength(OtpService.PASSWORD_LENGTH);
      expect(cleartextPassword).toMatch(/^[0-9]+$/);
    });

    it('hashes the password of the OTP document before saving it to the database', async () => {
      const retrievedOtpDocument = await otpModel
        .findById(newOtpDocument._id)
        .exec();

      expect(
        verify(
          retrievedOtpDocument!.get('password'),
          newOtpDocument.get('password'),
        ),
      ).resolves.toBe(true);
    });
  });

  describe('find', () => {
    const otpData: OtpData[] = [
      {
        type: 'user:registration',
        destination: 'user-1@email.com',
        ttlSeconds: 1 * 60,
      },
      {
        type: 'user:registration',
        destination: 'user-1@email.com',
        ttlSeconds: 2 * 60,
      },
      {
        type: 'user:validate-email',
        destination: 'user-2@email.com',
        ttlSeconds: 1 * 60,
      },
      {
        type: 'user:registration',
        destination: 'user-3@email.com',
        ttlSeconds: -1 * 60, // <-- will yield an expired document
      },
    ];

    beforeEach(async () => {
      for (const { type, destination, ttlSeconds } of otpData) {
        await otpService.create(type, destination, ttlSeconds);
      }
    });

    it('returns an array of documents it they match the specified criteria, and have not expired yet', async () => {
      const criteria: Pick<OtpData, 'type' | 'destination'> = {
        type: otpData[0]!.type,
        destination: otpData[0]!.destination,
      };
      const queriedOtpDocuments = await otpService.find(
        criteria.type,
        criteria.destination,
      );

      expect(queriedOtpDocuments).toHaveLength(2);

      for (const queriedOtpDocument of queriedOtpDocuments) {
        expect(queriedOtpDocument.get('type')).toBe(criteria.type);
        expect(queriedOtpDocument.get('destination')).toBe(
          criteria.destination,
        );
      }
    });

    it('throws a `NotFoundException` if there are no documents matching the specified criteria', () => {
      expect(() =>
        otpService.find('non-existent-type', 'non-existent@email.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws a `NotFoundException` if the documents match the specified criteria, but have expired', async () => {
      const expiredDocumentCriteria: Pick<OtpData, 'type' | 'destination'> = {
        type: otpData[3]!.type,
        destination: otpData[3]!.destination,
      };

      try {
        await otpService.find(
          expiredDocumentCriteria.type,
          expiredDocumentCriteria.destination,
        );
      } catch (error) {
        return expect(error).toBeInstanceOf(NotFoundException);
      }

      throw new Error('A `NotFoundExeption` was not thrown.');
    });
  });

  describe('isValid', () => {
    const otpData: OtpData = {
      type: 'user:registration',
      destination: 'user-1@email.com',
      ttlSeconds: 1 * 60,
    };

    let newOtpDocument: OtpDocument;

    beforeEach(async () => {
      newOtpDocument = await otpService.create(
        otpData.type,
        otpData.destination,
        otpData.ttlSeconds,
      );
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('returns true if at least one OTP document matches the specified criteria and the password is valid', async () => {
      const validationResult = await otpService.isValid(
        newOtpDocument.get('password'),
        {
          type: newOtpDocument.get('type'),
          destination: newOtpDocument.get('destination'),
        },
      );

      expect(validationResult).toBe(true);
    });

    it('deletes an OTP if it has been validated', async () => {
      const validationResult = await otpService.isValid(
        newOtpDocument.get('password'),
        {
          type: newOtpDocument.get('type'),
          destination: newOtpDocument.get('destination'),
        },
      );

      expect(validationResult).toBe(true);
      expect(otpModel.findById(newOtpDocument._id).exec()).resolves.toBeNull();
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

      const validationResult = await otpService.isValid(
        newOtpDocument.get('password'),
        {
          type: newOtpDocument.get('type'),
          destination: newOtpDocument.get('destination'),
        },
      );

      expect(validationResult).toBe(true);
      expect(() =>
        otpService.find(otpData.type, otpData.destination),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns false if the OTP documents matching the specified criteria fail the password validation test', async () => {
      const validationResult = await otpService.isValid('wrong-password', {
        type: newOtpDocument.get('type'),
        destination: newOtpDocument.get('destination'),
      });

      expect(validationResult).toBe(false);
    });

    it('returns false if there are no matching OTP documents', async () => {
      const validationResult = await otpService.isValid('123456', {
        type: 'non-existent-type',
        destination: 'non-existent@email.com',
      });

      expect(validationResult).toBe(false);
    });

    it('re-throws any error that is not an instance of `NotFoundException`', async () => {
      jest.spyOn(otpService, 'find').mockImplementation(() => {
        throw new InternalServerErrorException();
      });

      try {
        await otpService.find(otpData.type, otpData.destination);
      } catch (error) {
        return expect(error).toBeInstanceOf(InternalServerErrorException);
      }

      throw new Error('An `InternalServerErrorException` was not thrown.');
    });
  });
});
