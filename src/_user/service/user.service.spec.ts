import { INestApplication, NotFoundException } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { verify } from 'argon2';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Types } from 'mongoose';
import { Model } from 'mongoose';

import { ModelWithId } from '@/_library/helper';

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
      await userService.create(userData);

      expect(
        userModel.findOne({ username: userData.username }).exec(),
      ).resolves.toMatchObject({
        username: userData.username,
      });
    });

    it("hashes the user's password before saving it to the database", async () => {
      await userService.create(userData);

      const retrievedUser = await userModel
        .findOne({ username: userData.username })
        .exec();

      expect(
        verify(retrievedUser!.password, userData.password),
      ).resolves.toBeTruthy();
    });
  });

  describe('findOneBy', () => {
    const userData: User = {
      username: 'onetwo',
      password: 'wantoo',
    };

    let userId: string;

    beforeEach(async () => {
      userId = (await userModel.create(userData))._id.toString();
    });

    it.each<{
      property: keyof ModelWithId<User>;
      value: () => ModelWithId<User>[keyof ModelWithId<User>];
    }>([
      { property: '_id', value: () => userId },
      { property: 'username', value: () => userData.username },
    ] as const)(
      'returns the corresponding user from the database ($property: $value)',
      async ({ property, value }) => {
        const retrievedUser = await userService.findOneBy(property, value());

        expect(retrievedUser).toMatchObject({
          ...userData,
          password: expect.any(String), // the user's password is hashed before it is saved to the database.
        });
      },
    );

    it('throws a `NotFoundException` if the user could not be found in the database', () => {
      expect(
        userService.findOneBy('_id', new Types.ObjectId().toString()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const userData: User = {
      username: 'username-1000',
      password: 'password-1000',
    };

    let userId: string;

    beforeEach(async () => {
      userId = (await userModel.create(userData))._id.toString();
    });

    it("updates the specified user's data using the provided payload [without-password]", async () => {
      const newUsername = 'username-1111';

      expect(
        userModel.findOne({ username: newUsername }).exec(),
      ).resolves.toBeNull();

      await userService.update(userId, {
        username: newUsername,
      });

      expect(userModel.findById(userId).exec()).resolves.toMatchObject({
        username: newUsername,
      });
    });

    it('throws a `NotFoundException` if the user to update could not be found in the database', () => {
      expect(
        userService.update(new Types.ObjectId().toString(), {
          username: 'newUsername',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('hashes any provided user-password before updating it', async () => {
      const newPassword = 'password-1111';

      await userService.update(userId, { password: newPassword });

      const savedHashedPassword = (await userModel.findById(userId).exec())!
        .password;

      expect(verify(savedHashedPassword, newPassword)).resolves.toBeTruthy();
    });

    it('will not re-hash the password if it has not been updated', async () => {
      const newUsername = 'password-1111';

      await userService.update(userId, { username: newUsername });

      const savedHashedPassword = (await userModel.findById(userId).exec())!
        .password;

      expect(
        verify(savedHashedPassword, userData.password),
      ).resolves.toBeTruthy();
    });

    it("updates the specified user's data using the provided payload [with-password]", async () => {
      const newUserData: User = {
        username: 'username-xxxx',
        password: 'password-xxxx',
      };

      await userService.update(userId, newUserData);

      const updatedUser = (await userModel.findById(userId).exec())?.toObject();

      expect(updatedUser).toMatchObject({
        ...newUserData,
        password: expect.any(String),
      });

      expect(
        verify(updatedUser!.password, newUserData.password),
      ).resolves.toBeTruthy();
    });
  });

  describe('delete', () => {
    const userData: User = {
      username: 'hellooooo',
      password: 'nope.jpeg',
    };

    let userId: string;

    beforeEach(async () => {
      userId = (await userModel.create(userData))._id.toString();
    });

    it("removes the specified user's data from the database", async () => {
      await userService.delete(userId);

      const nonExistentUser = await userModel.findById(userId).exec();

      expect(nonExistentUser).toBeNull();
    });

    it('throws a `NotFoundException` if the specified user could not be deleted.', () => {
      expect(
        userService.delete(new Types.ObjectId().toString()),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
