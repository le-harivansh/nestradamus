import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { argon2id, hash } from 'argon2';
import { ObjectId, WithId } from 'mongodb';

import { fakeUserData } from '../../../test/helper/user';
import { User } from '../entity/user.entity';
import { UserRepository } from '../repository/user.repository';
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

  describe(UserService.prototype.count.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it(`calls '${UserRepository.name}::${UserRepository.prototype.count.name}'`, async () => {
      await userService.count();

      expect(userRepository.count).toHaveBeenCalledTimes(1);
    });

    it(`returns the value of '${UserRepository.name}::${UserRepository.prototype.count.name}'`, async () => {
      const resolvedCount = 5;

      userRepository.count.mockResolvedValueOnce(resolvedCount);

      await expect(userService.count()).resolves.toBe(resolvedCount);
    });
  });

  describe(UserService.prototype.list.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it(`calls '${UserRepository.name}::${UserRepository.prototype.list.name}' with the provided 'limit' & 'offset'`, async () => {
      const skip = 2;
      const limit = 5;

      await userService.list(skip, limit);

      expect(userRepository.list).toHaveBeenCalledTimes(1);
      expect(userRepository.list).toHaveBeenCalledWith(skip, limit);
    });

    it(`returns the value of '${UserRepository.name}::${UserRepository.prototype.list.name}'`, async () => {
      const users = Symbol('Users');

      userRepository.list.mockResolvedValueOnce(
        users as unknown as WithId<User>[],
      );

      await expect(userService.list(2, 3)).resolves.toBe(users);
    });
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

    beforeAll(() => {
      userRepository.create.mockResolvedValue({
        _id: newUserId,
        ...userData,
        password: hashedPassword,
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

    it('returns the newly created user', async () => {
      await expect(userService.create(userData)).resolves.toEqual({
        _id: newUserId,
        ...userData,
        password: hashedPassword,
      });
    });
  });

  describe(UserService.prototype.update.name, () => {
    const user: WithId<User> = {
      _id: new ObjectId(),
      ...fakeUserData(),
    };

    const userUpdates: Partial<User> = {
      firstName: 'Updated Firstname',
      email: 'updated-user@email.dev',
    };

    const updatedPassword = 'updated-password';

    afterEach(() => {
      jest.clearAllMocks();
    });

    it(`calls '${UserRepository.name}::${UserRepository.prototype.update.name}' with the specified updates`, async () => {
      userRepository.update.mockResolvedValueOnce({ ...user, ...userUpdates });

      await userService.update(user._id, userUpdates);

      expect(userRepository.update).toHaveBeenCalledTimes(1);
      expect(userRepository.update).toHaveBeenCalledWith(user._id, userUpdates);
    });

    it(`calls '${UserRepository.name}::${UserRepository.prototype.update.name}' with the specified updates & the hashed password (if any was provided)`, async () => {
      userRepository.update.mockResolvedValueOnce({
        ...user,
        ...userUpdates,
        password: hashedPassword,
      });

      await userService.update(user._id, {
        ...userUpdates,
        password: updatedPassword,
      });

      expect(userRepository.update).toHaveBeenCalledTimes(1);
      expect(userRepository.update).toHaveBeenCalledWith(user._id, {
        ...userUpdates,
        password: hashedPassword,
      });
    });

    it('returns the updated user', async () => {
      userRepository.update.mockResolvedValueOnce({
        ...user,
        ...userUpdates,
        password: hashedPassword,
      });

      await expect(
        userService.update(user._id, {
          ...userUpdates,
          password: updatedPassword,
        }),
      ).resolves.toEqual({ ...user, ...userUpdates, password: hashedPassword });
    });

    it(`throws an '${InternalServerErrorException.name} if the returned user is 'null'`, async () => {
      userRepository.update.mockResolvedValue(null);

      await expect(() =>
        userService.update(user._id, userUpdates),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe(UserService.prototype.delete.name, () => {
    const userId = new ObjectId();

    afterEach(() => {
      jest.clearAllMocks();
    });

    it(`calls '${UserRepository.name}::${UserRepository.prototype.delete.name}' with the specified id`, async () => {
      await userService.delete(userId);

      expect(userRepository.delete).toHaveBeenCalledTimes(1);
      expect(userRepository.delete).toHaveBeenCalledWith(userId);
    });
  });

  describe(UserService['hashPassword'].name, () => {
    const password = 'password';

    let result: string;

    beforeAll(async () => {
      result = await UserService['hashPassword'](password);
    });

    afterAll(() => {
      jest.clearAllMocks();
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
