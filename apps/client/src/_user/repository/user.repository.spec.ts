import { Test, TestingModule } from '@nestjs/testing';
import { Collection, Db, MongoClient, ObjectId } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { DATABASE } from '@library/database';

import { User, UserSchema } from '../schema/user.schema';
import { UserRepository } from './user.repository';

describe(UserRepository.name, () => {
  const testDatabaseName = 'test';

  let mongoMemoryServer: MongoMemoryServer;
  let mongoClient: MongoClient;

  let userRepository: UserRepository;

  let database: Db;
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

  describe(UserRepository.prototype.findById.name, () => {
    let userId: ObjectId;

    beforeAll(async () => {
      ({ insertedId: userId } = await userCollection.insertOne(
        new User('One', 'Two', '', 'user@email.dev', 'P@ssw0rd'),
      ));
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
      await userCollection.insertOne(
        new User('One', 'Two', '1212121212', email, 'P@ssw0rd'),
      );
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
      const userData = new User(
        'One',
        'Two',
        '1212121212',
        'user@email.dev',
        'P@ssw0rd',
      );

      const { insertedId } = await userRepository.create(userData);

      await expect(
        userCollection.findOne({ _id: insertedId }),
      ).resolves.toMatchObject({
        _id: insertedId,
        ...userData,
      });
    });
  });

  describe(UserRepository.prototype.update.name, () => {
    const user = new User(
      'One',
      'Two',
      '1234567890',
      'user@email.dev',
      'P@ssw0rd',
    );

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
});
