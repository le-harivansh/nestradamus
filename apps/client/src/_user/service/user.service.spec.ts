import { NotFoundException } from '@nestjs/common';
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
  let userService: UserService;
  let userRepository: jest.Mocked<UserRepository>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserRepository, UserService],
    }).compile();

    userService = module.get(UserService);
    userRepository = module.get(UserRepository);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe(UserService.prototype.createUser.name, () => {
    const userData: User = fakeUserData();
    const newUserId = new ObjectId();
    const hashedPassword = 'hashed-password';

    let result: Omit<WithId<User>, 'password'>;

    beforeAll(async () => {
      (hash as jest.Mock).mockResolvedValue(hashedPassword);

      userRepository.create.mockResolvedValue({
        acknowledged: true,
        insertedId: newUserId,
      });

      result = await userService.createUser(userData);
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it('hashes the passed-in password', () => {
      expect(hash).toHaveBeenCalledTimes(1);
      expect(hash).toHaveBeenCalledWith(userData.password, { type: argon2id });
    });

    it(`calls '${UserRepository.name}::${UserRepository.prototype.create.name}' with the email and the hashed password`, () => {
      expect(userRepository.create).toHaveBeenCalledTimes(1);
      expect(userRepository.create).toHaveBeenCalledWith({
        ...userData,
        password: hashedPassword,
      });
    });

    it("returns the '_id' and the 'email' of the newly created user", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...otherUserData } = userData;

      expect(result).toEqual({
        _id: newUserId,
        ...otherUserData,
      });
    });
  });

  describe(UserService.prototype.findUserById.name, () => {
    const userId = new ObjectId().toString();

    afterEach(() => {
      jest.clearAllMocks();
    });

    it(`calls '${UserRepository.name}::${UserRepository.prototype.findById.name}' with the provided 'id'`, async () => {
      await userService.findUserById(userId);

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

      await expect(
        userService.findUserById(new ObjectId().toString()),
      ).resolves.toBe(user);
    });

    it(`throws '${NotFoundException.name}' if '${UserRepository.name}::${UserRepository.prototype.findById.name}' returns 'null'`, async () => {
      userRepository.findById.mockResolvedValueOnce(null);

      await expect(
        userService.findUserById(new ObjectId().toString()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe(UserService.prototype.findUserByEmail.name, () => {
    const email = 'user@email.dev';

    afterEach(() => {
      jest.clearAllMocks();
    });

    it(`calls '${UserRepository.name}::${UserRepository.prototype.findByEmail.name}' with the provided 'email'`, async () => {
      await userService.findUserByEmail(email);

      expect(userRepository.findByEmail).toHaveBeenCalledTimes(1);
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
    });

    it(`returns the value of '${UserRepository.name}::${UserRepository.prototype.findByEmail.name}' if it is not 'null'`, async () => {
      const user = Symbol('fetched user');

      userRepository.findByEmail.mockResolvedValueOnce(
        user as unknown as WithId<User>,
      );

      await expect(userService.findUserByEmail(email)).resolves.toBe(user);
    });

    it(`throws '${NotFoundException.name}' if '${UserRepository.name}::${UserRepository.prototype.findByEmail.name}' returns 'null'`, async () => {
      userRepository.findByEmail.mockResolvedValueOnce(null);

      await expect(userService.findUserByEmail(email)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
