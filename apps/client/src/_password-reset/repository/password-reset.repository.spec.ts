import { Test, TestingModule } from '@nestjs/testing';
import { Collection, Db, MongoClient, ObjectId } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { DATABASE } from '@library/database';

import {
  PasswordReset,
  PasswordResetSchema,
} from '../schema/password-reset.schema';
import { PasswordResetRepository } from './password-reset.repository';

describe(PasswordResetRepository.name, () => {
  const testDatabaseName = 'test';

  let mongoMemoryServer: MongoMemoryServer;
  let mongoClient: MongoClient;

  let passwordResetRepository: PasswordResetRepository;

  let database: Db;
  let passwordResetCollection: Collection<PasswordReset>;

  beforeAll(async () => {
    mongoMemoryServer = await MongoMemoryServer.create();
    mongoClient = await MongoClient.connect(mongoMemoryServer.getUri());

    database = mongoClient.db(testDatabaseName);
    passwordResetCollection = database.collection<PasswordReset>(
      PasswordResetSchema.collectionName,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: DATABASE,
          useValue: database,
        },

        PasswordResetRepository,
      ],
    }).compile();

    passwordResetRepository = module.get(PasswordResetRepository);
  });

  afterAll(async () => {
    await mongoClient.close();
    await mongoMemoryServer.stop();
  });

  it('should be defined', () => {
    expect(passwordResetRepository).toBeDefined();
  });

  describe(PasswordResetRepository.prototype.findById.name, () => {
    let passwordResetId: ObjectId;

    beforeAll(async () => {
      ({ insertedId: passwordResetId } =
        await passwordResetCollection.insertOne(
          new PasswordReset(new ObjectId(), new Date()),
        ));
    });

    afterAll(async () => {
      await database.dropDatabase();
    });

    it('returns the password-reset record with the matching id', async () => {
      const retrievedPasswordReset =
        await passwordResetRepository.findById(passwordResetId);

      expect(retrievedPasswordReset!._id).toStrictEqual(passwordResetId);
    });

    it('returns null if the specified password-reset cannot be found', async () => {
      await expect(
        passwordResetRepository.findById(new ObjectId()),
      ).resolves.toBeNull();
    });
  });

  describe(PasswordResetRepository.prototype.findByUserId.name, () => {
    const userId = new ObjectId();

    beforeAll(async () => {
      await passwordResetCollection.insertOne(
        new PasswordReset(userId, new Date()),
      );
    });

    afterAll(async () => {
      await database.dropDatabase();
    });

    it('returns the password-reset record with the matching user-id', async () => {
      const retrievedPasswordReset =
        await passwordResetRepository.findByUserId(userId);

      expect(retrievedPasswordReset!.userId).toStrictEqual(userId);
    });

    it('returns null if the specified password-reset cannot be found', async () => {
      await expect(
        passwordResetRepository.findByUserId(new ObjectId()),
      ).resolves.toBeNull();
    });
  });

  describe(PasswordResetRepository.prototype.create.name, () => {
    afterAll(async () => {
      await database.dropDatabase();
    });

    it('inserts a new password-reset record into the database', async () => {
      const passwordReset = new PasswordReset(new ObjectId(), new Date());

      const { insertedId } =
        await passwordResetRepository.create(passwordReset);

      await expect(
        passwordResetCollection.findOne({ _id: insertedId }),
      ).resolves.toMatchObject({
        _id: insertedId,
        ...passwordReset,
      });
    });
  });

  describe(PasswordResetRepository.prototype.update.name, () => {
    const userId = new ObjectId();
    const createdAt = new Date('2024-01-01T00:00:00');
    const newCreatedAt = new Date('2024-03-01T00:00:00');

    let passwordResetId: ObjectId;

    beforeAll(async () => {
      ({ insertedId: passwordResetId } =
        await passwordResetCollection.insertOne(
          new PasswordReset(userId, createdAt),
        ));
    });

    afterAll(async () => {
      await database.dropDatabase();
    });

    it('updates the password-reset with the provided date', async () => {
      await passwordResetRepository.update(passwordResetId, {
        createdAt: newCreatedAt,
      });

      const retrievedPasswordReset = await passwordResetCollection.findOne({
        userId,
        createdAt: newCreatedAt,
      });

      expect(retrievedPasswordReset!.createdAt).toStrictEqual(newCreatedAt);
    });
  });

  describe(PasswordResetRepository.prototype.delete.name, () => {
    let passwordResetId: ObjectId;

    beforeAll(async () => {
      ({ insertedId: passwordResetId } =
        await passwordResetCollection.insertOne(
          new PasswordReset(new ObjectId(), new Date()),
        ));
    });

    afterAll(async () => {
      await database.dropDatabase();
    });

    it('deletes an existing password-reset record from the database', async () => {
      await passwordResetRepository.delete(passwordResetId);

      await expect(
        passwordResetCollection.findOne({ _id: passwordResetId }),
      ).resolves.toBeNull();
    });
  });
});