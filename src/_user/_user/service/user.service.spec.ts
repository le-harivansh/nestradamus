import { INestApplication, NotFoundException } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { verify } from 'argon2';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Types } from 'mongoose';
import { Model } from 'mongoose';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';

import { User, UserDocument, UserSchema } from '../schema/user.schema';
import { UserService } from './user.service';

jest.mock('@/_application/_logger/service/winston-logger.service');

describe(UserService.name, () => {
  let application: INestApplication;
  let mongoMemoryServer: MongoMemoryServer;

  let loggerService: jest.Mocked<WinstonLoggerService>;
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
      providers: [WinstonLoggerService, UserService],
    }).compile();

    application = moduleFixture.createNestApplication();
    loggerService = application.get(WinstonLoggerService);
    userService = application.get(UserService);

    userModel = application.get<Model<User>>(getModelToken(User.name));

    await application.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();

    await userModel.deleteMany();
  });

  afterAll(async () => {
    await application.close();
    await mongoMemoryServer.stop();
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('create', () => {
    const userData: User = {
      email: 'user@email.com',
      password: 'P@ssw0rd',
    };

    let newUser: UserDocument;

    beforeEach(async () => {
      newUser = await userService.create(userData.email, userData.password);
    });

    it("saves the provided user's data to the database", async () => {
      await expect(
        userModel.findOne({ email: userData.email }).exec(),
      ).resolves.toMatchObject({
        email: userData.email,
      });
    });

    it("hashes the user's password before saving it to the database", async () => {
      const retrievedUser = await userModel
        .findOne({ email: userData.email })
        .exec();

      await expect(
        verify(retrievedUser!.get('password'), userData.password),
      ).resolves.toBeTruthy();
    });

    it('logs data about the newly created user', () => {
      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith('Created user', newUser);
    });
  });

  describe('findOne', () => {
    const userData: User = {
      email: 'user@email.com',
      password: 'P@ssw0rd',
    };

    let userId: Types.ObjectId;

    beforeEach(async () => {
      userId = (await userModel.create(userData))._id;

      jest.clearAllMocks();
    });

    it.each([
      { criteria: () => userId },
      { criteria: () => ({ email: userData.email }) },
    ] as const)(
      'returns the corresponding user from the database',
      async ({ criteria }) => {
        const retrievedUser = await userService.findOne(criteria());

        expect(retrievedUser).toMatchObject({
          ...userData,
          password: expect.any(String), // the user's password is hashed before it is saved to the database.
        });
      },
    );

    it('throws a `NotFoundException` if the user could not be found in the database', async () => {
      await expect(userService.findOne(new Types.ObjectId())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('logs data about the queried user', async () => {
      const retrievedUser = await userService.findOne(userId);

      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Queried user',
        retrievedUser,
      );
    });
  });

  describe('update', () => {
    const userData: User = {
      email: 'user@email.com',
      password: 'P@ssw0rd',
    };

    let user: UserDocument;

    beforeEach(async () => {
      user = await userModel.create(userData);
    });

    describe.each([
      { type: 'Types.ObjectId', criteria: () => user._id },
      { type: 'email', criteria: () => ({ email: userData.email }) },
    ])('- with $type', ({ criteria }) => {
      it("updates the specified user's data using the provided payload [without-password]", async () => {
        const newEmail = 'new-email@user.com';

        await userService.update(criteria(), {
          email: newEmail,
        });

        await expect(
          userModel.findById(user._id).exec(),
        ).resolves.toMatchObject({
          email: newEmail,
        });
      });

      it('hashes any provided user-password before updating it', async () => {
        const newPassword = 'password-1111';

        await userService.update(criteria(), { password: newPassword });

        const savedHashedPassword = (await userModel.findById(user).exec())!
          .password;

        await expect(
          verify(savedHashedPassword, newPassword),
        ).resolves.toBeTruthy();
      });

      it('will not re-hash the password if it has not been updated', async () => {
        const newEmail = 'new-user@email.com';

        await userService.update(criteria(), { email: newEmail });

        const savedHashedPassword = (await userModel.findById(user).exec())!
          .password;

        await expect(
          verify(savedHashedPassword, userData.password),
        ).resolves.toBeTruthy();
      });

      it("updates the specified user's data using the provided payload [with-password]", async () => {
        const newUserData: User = {
          email: 'new-user@email.com',
          password: 'new-P@ssw0rd',
        };

        await userService.update(criteria(), newUserData);

        const updatedUser = (await userModel.findById(user).exec())?.toObject();

        expect(updatedUser).toMatchObject({
          ...newUserData,
          password: expect.any(String),
        });

        await expect(
          verify(updatedUser!.password, newUserData.password),
        ).resolves.toBeTruthy();
      });
    });

    it('throws a `NotFoundException` if the user to update could not be found in the database', async () => {
      await expect(
        userService.update(new Types.ObjectId(), {
          email: 'new-user@email.com',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('logs data about the updated user', async () => {
      const updatedUser = await userService.update(
        { email: userData.email },
        { email: 'updated-user@email.com' },
      );

      expect(loggerService.log).toHaveBeenCalledTimes(2);
      expect(loggerService.log).toHaveBeenLastCalledWith(
        'Updated user',
        updatedUser,
      );
    });
  });

  describe('delete', () => {
    const userData: User = {
      email: 'user@email.com',
      password: 'P@ssw0rd',
    };

    let userId: Types.ObjectId;

    beforeEach(async () => {
      userId = (await userModel.create(userData))._id;
    });

    it("removes the specified user's data from the database", async () => {
      await userService.delete(userId);

      const nonExistentUser = await userModel.findById(userId).exec();

      expect(nonExistentUser).toBeNull();
    });

    it('throws a `NotFoundException` if the specified user could not be deleted.', async () => {
      await expect(userService.delete(new Types.ObjectId())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('logs data about the deleted user', async () => {
      await userService.delete(userId);

      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith('Deleted user', {
        id: userId,
      });
    });
  });
});
