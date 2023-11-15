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
      email: 'user@email.com',
      password: 'P@ssw0rd',
    };

    it("saves the provided user's data to the database", async () => {
      await userService.create(userData);

      expect(
        userModel.findOne({ email: userData.email }).exec(),
      ).resolves.toMatchObject({
        email: userData.email,
      });
    });

    it("hashes the user's password before saving it to the database", async () => {
      await userService.create(userData);

      const retrievedUser = await userModel
        .findOne({ email: userData.email })
        .exec();

      expect(
        verify(retrievedUser!.password, userData.password),
      ).resolves.toBeTruthy();
    });
  });

  describe('findOneBy', () => {
    const userData: User = {
      email: 'user@email.com',
      password: 'P@ssw0rd',
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
      { property: 'email', value: () => userData.email },
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
      email: 'user@email.com',
      password: 'P@ssw0rd',
    };

    let userId: string;

    beforeEach(async () => {
      userId = (await userModel.create(userData))._id.toString();
    });

    it("updates the specified user's data using the provided payload [without-password]", async () => {
      const newEmail = 'new-email@user.com';

      expect(userModel.findOne({ email: newEmail }).exec()).resolves.toBeNull();

      await userService.update(userId, {
        email: newEmail,
      });

      expect(userModel.findById(userId).exec()).resolves.toMatchObject({
        email: newEmail,
      });
    });

    it('throws a `NotFoundException` if the user to update could not be found in the database', () => {
      expect(
        userService.update(new Types.ObjectId().toString(), {
          email: 'new-user@email.com',
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
      const newEmail = 'new-user@email.com';

      await userService.update(userId, { email: newEmail });

      const savedHashedPassword = (await userModel.findById(userId).exec())!
        .password;

      expect(
        verify(savedHashedPassword, userData.password),
      ).resolves.toBeTruthy();
    });

    it("updates the specified user's data using the provided payload [with-password]", async () => {
      const newUserData: User = {
        email: 'new-user@email.com',
        password: 'new-P@ssw0rd',
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
      email: 'user@email.com',
      password: 'P@ssw0rd',
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
