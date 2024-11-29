import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { argon2id, hash } from 'argon2';
import { ObjectId, WithId } from 'mongodb';

import { fakeUserData } from '../../../test/helper';
import { UserRepository } from '../repository/user.repository';
import { User } from '../schema/user.schema';
import { UserService } from './user.service';

jest.mock('../repository/user.repository');
jest.mock('argon2');

describe(UserService.name, () => {
  const hashedPassword = 'hashed-password';

  let userService: UserService;
  let userRepository: jest.Mocked<UserRepository>;

  beforeAll(async () => {
    (hash as jest.Mock).mockResolvedValue(hashedPassword);

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserRepository, UserService],
    }).compile();

    userService = module.get(UserService);
    userRepository = module.get(UserRepository);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe(UserService.prototype.findById.name, () => {
    const userId = new ObjectId();

    afterEach(() => {
      jest.clearAllMocks();
    });

    it(`calls '${UserRepository.name}::${UserRepository.prototype.findById.name}' with the provided 'id'`, async () => {
      await userService.findById(userId);

      expect(userRepository.findById).toHaveBeenCalledTimes(1);
      expect(userRepository.findById).toHaveBeenCalledWith(
        new ObjectId(userId),
      );
    });

    it(`returns the value of '${UserRepository.name}::${UserRepository.prototype.findById.name}' if it is not 'null'`, async () => {
      const user = Symbol('fetched user');

      userRepository.findById.mockResolvedValueOnce(
        user as unknown as WithId<User>,
      );

      await expect(userService.findById(new ObjectId())).resolves.toBe(user);
    });

    it(`throws '${NotFoundException.name}' if '${UserRepository.name}::${UserRepository.prototype.findById.name}' returns 'null'`, async () => {
      userRepository.findById.mockResolvedValueOnce(null);

      await expect(userService.findById(new ObjectId())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe(UserService.prototype.findByEmail.name, () => {
    const email = 'user@email.dev';

    afterEach(() => {
      jest.clearAllMocks();
    });

    it(`calls '${UserRepository.name}::${UserRepository.prototype.findByEmail.name}' with the provided 'email'`, async () => {
      await userService.findByEmail(email);

      expect(userRepository.findByEmail).toHaveBeenCalledTimes(1);
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
    });

    it(`returns the value of '${UserRepository.name}::${UserRepository.prototype.findByEmail.name}' if it is not 'null'`, async () => {
      const user = Symbol('fetched user');

      userRepository.findByEmail.mockResolvedValueOnce(
        user as unknown as WithId<User>,
      );

      await expect(userService.findByEmail(email)).resolves.toBe(user);
    });

    it(`throws '${NotFoundException.name}' if '${UserRepository.name}::${UserRepository.prototype.findByEmail.name}' returns 'null'`, async () => {
      userRepository.findByEmail.mockResolvedValueOnce(null);

      await expect(userService.findByEmail(email)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe(UserService.prototype.create.name, () => {
    const newUserId = new ObjectId();
    const userData: User = fakeUserData();

    beforeEach(() => {
      userRepository.create.mockResolvedValue({
        acknowledged: true,
        insertedId: newUserId,
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it(`calls '${UserRepository.name}::${UserRepository.prototype.create.name}' with the email and the hashed password`, async () => {
      await userService.create(userData);

      expect(userRepository.create).toHaveBeenCalledTimes(1);
      expect(userRepository.create).toHaveBeenCalledWith({
        ...userData,
        password: hashedPassword,
      });
    });

    it('returns the newly created user without its password', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...otherUserData } = userData;

      await expect(userService.create(userData)).resolves.toEqual({
        _id: newUserId,
        ...otherUserData,
      });
    });

    it(`throws an '${InternalServerErrorException.name} if the 'acknowledged' property of the result is false`, async () => {
      userRepository.create.mockResolvedValue({
        acknowledged: false,
        insertedId: undefined as unknown as ObjectId,
      });

      await expect(() => userService.create(userData)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe(UserService.prototype.update.name, () => {
    const userId = new ObjectId();

    const user: WithId<User> = {
      _id: userId,
      ...fakeUserData(),
    };
    const userUpdates: Partial<User> = {
      firstName: 'Updated Firstname',
      email: 'updated-user@email.dev',
      password: 'updated-password',
    };
    const updatedUser: WithId<User> = {
      ...user,
      ...userUpdates,
    };

    beforeAll(() => {
      userRepository.update.mockResolvedValue(updatedUser);
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it(`calls '${UserRepository.name}::${UserRepository.prototype.update.name}' with the email and the hashed password`, async () => {
      await userService.update(user._id, userUpdates);

      expect(userRepository.update).toHaveBeenCalledTimes(1);
      expect(userRepository.update).toHaveBeenCalledWith(user._id, {
        ...userUpdates,
        password: hashedPassword,
      });
    });

    it('returns the updated user without its password', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...otherUpdatedUserData } = updatedUser;

      await expect(userService.update(user._id, userUpdates)).resolves.toEqual(
        otherUpdatedUserData,
      );
    });

    it(`throws an '${InternalServerErrorException.name} if the returned user is 'null'`, async () => {
      userRepository.update.mockResolvedValue(null);

      await expect(() =>
        userService.update(user._id, userUpdates),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe(UserService['hashPassword'].name, () => {
    const password = 'password';

    let result: string;

    beforeAll(async () => {
      result = await UserService['hashPassword'](password);
    });

    it(`calls '${hash.name}' to hash the passed in password`, () => {
      expect(hash).toHaveBeenCalledTimes(1);
      expect(hash).toHaveBeenCalledWith(password, { type: argon2id });
    });

    it(`returns the result of the '${hash.name}' function`, () => {
      expect(result).toBe(hashedPassword);
    });
  });
});
