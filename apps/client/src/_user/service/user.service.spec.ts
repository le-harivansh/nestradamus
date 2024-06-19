import { Test, TestingModule } from '@nestjs/testing';
import { argon2id, hash } from 'argon2';
import { ObjectId, WithId } from 'mongodb';

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
    const userData: User = {
      firstName: 'One',
      lastName: 'Two',
      phoneNumber: '1212121212',
      email: 'user@email.dev',
      password: 'P@ssw0rd',
    };
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
});
