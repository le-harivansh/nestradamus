import { Test, TestingModule } from '@nestjs/testing';
import { Db, MongoClient, ObjectId } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { DATABASE } from '@application/database';

import { User, UserSchema } from '../schema/user.schema';
import { UserRepository } from './user.repository';

describe(UserRepository.name, () => {
  const testDatabaseName = 'test';

  let mongoMemoryServer: MongoMemoryServer;
  let mongoClient: MongoClient;

  let userRepository: UserRepository;
  let database: Db;

  beforeAll(async () => {
    mongoMemoryServer = await MongoMemoryServer.create();
    mongoClient = await MongoClient.connect(mongoMemoryServer.getUri());

    database = mongoClient.db(testDatabaseName);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: DATABASE,
          useValue: database,
        },

        UserRepository,
      ],
    }).compile();

    userRepository = module.get(UserRepository);
  });

  afterAll(async () => {
    await mongoClient.close();
    await mongoMemoryServer.stop();
  });

  it('should be defined', () => {
    expect(userRepository).toBeDefined();
  });

  describe(UserRepository.prototype.findById.name, () => {
    let userId: ObjectId;

    beforeAll(async () => {
      userId = (
        await database.collection<User>(UserSchema.collectionName).insertOne({
          firstName: 'One',
          lastName: 'Two',
          phoneNumber: '',
          email: 'user@email.dev',
          password: 'P@ssw0rd',
        })
      ).insertedId;
    });

    afterAll(async () => {
      await database.dropDatabase();
    });

    it('returns the user with the matching id', async () => {
      const retrievedUser = await userRepository.findById(userId);

      expect(retrievedUser?._id).toStrictEqual(userId);
    });

    it('returns null if the specified user cannot be found', async () => {
      await expect(userRepository.findById(new ObjectId())).resolves.toBeNull();
    });
  });

  describe(UserRepository.prototype.findByEmail.name, () => {
    const email = 'user@email.dev';

    beforeAll(async () => {
      await database.collection<User>(UserSchema.collectionName).insertOne({
        firstName: 'One',
        lastName: 'Two',
        phoneNumber: '1212121212',
        email,
        password: 'P@ssw0rd',
      });
    });

    afterAll(async () => {
      await database.dropDatabase();
    });

    it('returns the user with the matching email', async () => {
      const retrievedUser = await userRepository.findByEmail(email);

      expect(retrievedUser!.email).toBe(email);
    });

    it('returns null if the specified user cannot be found', async () => {
      await expect(
        userRepository.findByEmail('invalid@email.tld'),
      ).resolves.toBeNull();
    });
  });

  describe(UserRepository.prototype.create.name, () => {
    afterAll(async () => {
      await database.dropDatabase();
    });

    it('inserts a new user into the database', async () => {
      const userData: User = {
        firstName: 'One',
        lastName: 'Two',
        phoneNumber: '1212121212',
        email: 'user@email.dev',
        password: 'P@ssw0rd',
      };

      const { insertedId } = await userRepository.create(userData);

      await expect(
        database
          .collection<User>(UserSchema.collectionName)
          .findOne({ _id: insertedId }),
      ).resolves.toMatchObject({
        _id: insertedId,
        ...userData,
      });
    });
  });
});
