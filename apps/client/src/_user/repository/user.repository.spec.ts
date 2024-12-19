import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Collection, Db, MongoClient, ObjectId } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { DATABASE } from '@library/database';

import { fakeUserData } from '../../../test/helper/user';
import { User } from '../entity/user.entity';
import { UserSchema } from '../entity/user.schema';
import { UserRepository } from './user.repository';

describe(UserRepository.name, () => {
  const testDatabaseName = 'test';

  let mongoMemoryServer: MongoMemoryServer;

  let mongoClient: MongoClient;
  let database: Db;

  let userRepository: UserRepository;
  let userCollection: Collection<User>;

  beforeAll(async () => {
    mongoMemoryServer = await MongoMemoryServer.create();

    mongoClient = await MongoClient.connect(mongoMemoryServer.getUri());
    database = mongoClient.db(testDatabaseName);

    userCollection = database.collection<User>(UserSchema.collectionName);

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

  describe(UserRepository.prototype.count.name, () => {
    const userCount = 4;

    beforeAll(async () => {
      await userCollection.insertMany(
        [...Array(userCount).keys()].map(() => fakeUserData()),
      );
    });

    afterAll(async () => {
      await database.dropDatabase();
    });

    it('returns the number of users in the database', async () => {
      await expect(userRepository.count()).resolves.toBe(userCount);
    });
  });

  describe(UserRepository.prototype.list.name, () => {
    const userCount = 5;
    const usersData = [...Array(userCount).keys()].map(() => fakeUserData());

    beforeAll(async () => {
      await userCollection.insertMany(usersData);
    });

    afterAll(async () => {
      await database.dropDatabase();
    });

    it('returns the correct users based on the limit & offset', async () => {
      const skip = 1;
      const limit = 2;

      const users = await userRepository.list(skip, limit);

      expect(users.length).toBe(limit);

      for (let i = 0; i < users.length; i++) {
        expect(users[i]).toMatchObject(usersData[i + skip]!);
      }
    });
  });

  describe(UserRepository.prototype.findById.name, () => {
    let userId: ObjectId;

    beforeAll(async () => {
      ({ insertedId: userId } = await userCollection.insertOne(fakeUserData()));
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
      await userCollection.insertOne(new User('One', 'Two', email, 'P@ssw0rd'));
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
    let collectionInsertOneMethodSpy: jest.SpyInstance;

    beforeAll(() => {
      collectionInsertOneMethodSpy = jest.spyOn(
        userRepository['collection'],
        'insertOne',
      );
    });

    afterAll(async () => {
      await database.dropDatabase();
    });

    it('inserts a new user into the database', async () => {
      const userData = fakeUserData();
      const newUser = await userRepository.create(userData);

      await expect(
        userCollection.findOne({ _id: newUser._id }),
      ).resolves.toMatchObject({
        _id: newUser._id,
        ...userData,
      });
    });

    it(`throws an '${InternalServerErrorException.name}' if the operation is not acknowledged`, async () => {
      collectionInsertOneMethodSpy.mockResolvedValueOnce({
        acknowledged: false,
        insertedId: undefined as unknown as ObjectId,
      });

      await expect(() => userRepository.create(fakeUserData())).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe(UserRepository.prototype.update.name, () => {
    const user = fakeUserData();
    const userUpdates: Partial<User> = {
      lastName: 'Three',
      email: 'updated-user@email.dev',
    };

    let insertedUserId: ObjectId;

    beforeAll(async () => {
      ({ insertedId: insertedUserId } = await userCollection.insertOne(user));
    });

    afterAll(async () => {
      await database.dropDatabase();
    });

    it('updates an existing user', async () => {
      await expect(
        userRepository.update(insertedUserId, userUpdates),
      ).resolves.toMatchObject({
        _id: insertedUserId,
        ...user,
        ...userUpdates,
      });
    });
  });

  describe(UserRepository.prototype.delete.name, () => {
    let collectionDeleteOneMethodSpy: jest.SpyInstance;
    let insertedUserId: ObjectId | null = null;

    beforeAll(() => {
      collectionDeleteOneMethodSpy = jest.spyOn(
        userRepository['collection'],
        'deleteOne',
      );
    });

    beforeEach(async () => {
      ({ insertedId: insertedUserId } =
        await userCollection.insertOne(fakeUserData()));
    });

    afterEach(() => {
      insertedUserId = null;
    });

    afterAll(async () => {
      await database.dropDatabase();
    });

    it('deletes a user instance from the database', async () => {
      await userRepository.delete(insertedUserId!);

      await expect(
        userCollection.findOne({ _id: insertedUserId! }),
      ).resolves.toBe(null);
    });

    it(`throws an '${InternalServerErrorException.name}' if the operation is not acknowledged`, async () => {
      collectionDeleteOneMethodSpy.mockResolvedValueOnce({
        acknowledged: false,
        deletedCount: undefined as unknown as number,
      });

      await expect(() =>
        userRepository.delete(insertedUserId!),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it(`throws an '${InternalServerErrorException.name}' if the deleted-count is not 1`, async () => {
      collectionDeleteOneMethodSpy.mockResolvedValueOnce({
        acknowledged: true,
        deletedCount: 0,
      });

      await expect(() =>
        userRepository.delete(insertedUserId!),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
