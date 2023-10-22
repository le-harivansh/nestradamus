import { INestApplication } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { verify } from 'argon2';
import { ObjectId } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Model } from 'mongoose';

import { User, UserSchema } from '../schema/user.schema';
import { UserService } from './user.service';

describe(UserService.name, () => {
  let application: INestApplication;
  let mongoMemoryServer: MongoMemoryServer;

  let userService: UserService;

  let userModel: Model<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRootAsync({
          async useFactory() {
            mongoMemoryServer = await MongoMemoryServer.create();

            return { uri: mongoMemoryServer.getUri() };
          },
        }),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [UserService],
    }).compile();

    application = moduleFixture.createNestApplication();
    userService = application.get(UserService);

    userModel = application.get<Model<User>>(getModelToken(User.name));

    await application.init();
  });

  afterEach(async () => {
    await userModel.deleteMany();
  });

  afterAll(async () => {
    await application.close();
    await mongoMemoryServer.stop();
  });

  describe('createUser', () => {
    const userData: User = {
      username: 'le-user',
      password: 'nope.jpeg',
    };

    it("saves the provided user's data to the database", async () => {
      await userService.createUser(userData);

      expect(
        userModel.findOne({ username: userData.username }).exec(),
      ).resolves.toMatchObject({
        username: userData.username,
      });
    });

    it("hashes the user's password before saving it to the database", async () => {
      await userService.createUser(userData);

      const { password: hashedPassword } = await userModel
        .findOne({ username: userData.username })
        .exec();

      expect(verify(hashedPassword, userData.password)).resolves.toBeTruthy();
    });
  });

  describe('findByUsername', () => {
    const userData: User = {
      username: 'onetwo',
      password: 'wantoo',
    };

    beforeAll(async () => {
      await userModel.create(userData);
    });

    // @todo: fix
    it.skip('returns the corresponding user from the database', async () => {
      expect(
        userService.findByUsername(userData.username),
      ).resolves.toMatchObject(userData);
    });

    it('returns undefined if the user could not be found in the database', async () => {
      expect(userService.findByUsername('non-existant-user')).resolves
        .toBeUndefined;
    });
  });

  describe('findById', () => {
    const userData: User = {
      username: 'threefour',
      password: 'sureefoar',
    };

    let userId: string;

    beforeAll(async () => {
      userId = (await userModel.create(userData))._id.toString();
    });

    // @todo: fix
    it.skip('returns the corresponding user from the database', async () => {
      expect(await userService.findById(userId)).toMatchObject(userData);
    });

    it('returns null if the user could not be found in the database', async () => {
      expect(
        userService.findById(new ObjectId().toString()),
      ).resolves.toBeNull();
    });
  });

  describe('updateUserWithId', () => {
    const userData = {
      username: 'username-1000',
      password: 'password-1000',
    };

    let userId: string;

    beforeEach(async () => {
      userId = (await userModel.create(userData))._id.toString();
    });

    it("updates the specified user's data using the provided payload [no-password]", async () => {
      const newUsername = 'username-1111';

      expect(
        userModel.findOne({ username: newUsername }).exec(),
      ).resolves.toBeNull();

      await userService.updateUserWithId(userId, {
        username: newUsername,
      });

      expect(userModel.findById(userId).exec()).resolves.toMatchObject({
        username: newUsername,
      });
    });

    it('hashes any provided user-password before updating it', async () => {
      const newPassword = 'password-1111';

      await userService.updateUserWithId(userId, { password: newPassword });

      const savedHashedPassword = (await userModel.findById(userId).exec())
        .password;

      expect(verify(savedHashedPassword, newPassword)).resolves.toBeTruthy();
    });

    it('will not re-hash the password if it has not been updated', async () => {
      const newUsername = 'password-1111';

      await userService.updateUserWithId(userId, { username: newUsername });

      const savedHashedPassword = (await userModel.findById(userId).exec())
        .password;

      expect(
        verify(savedHashedPassword, userData.password),
      ).resolves.toBeTruthy();
    });

    it("updates the specified user's data using the provided payload [password]", async () => {
      const newUserData = {
        username: 'username-xxxx',
        password: 'password-xxxx',
      };

      await userService.updateUserWithId(userId, newUserData);

      const updatedUser = await userModel.findById(userId).exec();

      expect(
        verify(updatedUser.password, newUserData.password),
      ).resolves.toBeTruthy();

      expect(userModel.findById(userId).exec()).resolves.toMatchObject({
        username: newUserData.username,
      });
    });
  });

  describe('deleteUserWithId', () => {
    const userData: User = {
      username: 'hellooooo',
      password: 'nope.jpeg',
    };

    let userId: string;

    beforeEach(async () => {
      userId = (await userModel.create(userData))._id.toString();
    });

    it("removes the specified user's data from the database", async () => {
      await userService.deleteById(userId);

      expect(userModel.findById(userId).exec()).resolves.toBeNull();
    });
  });
});
