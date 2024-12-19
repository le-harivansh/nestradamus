import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId, WithId } from 'mongodb';

import { DATABASE } from '@library/database';

import { fakeUserData } from '../../../test/helper/user';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entity/user.entity';
import { SerializedUser } from '../entity/user.serialized-entity';
import { UserService } from '../service/user.service';
import { UserController } from './user.controller';

jest.mock('../service/user.service');

describe(UserController.name, () => {
  const authenticatedUser: WithId<User> = {
    _id: new ObjectId(),
    ...fakeUserData({ permissions: ['user:create:own'] }),
  };
  const otherUser: WithId<User> = { _id: new ObjectId(), ...fakeUserData() };

  let userService: jest.Mocked<UserService>;

  let userController: UserController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,

        // `RouteParameterResolverPipe` dependencies
        {
          provide: DATABASE,
          useValue: undefined,
        },
      ],
    }).compile();

    userController = module.get(UserController);

    userService = module.get(UserService);
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
  });

  describe(UserController.prototype.list.name, () => {
    const resultingUsers = [
      {
        _id: new ObjectId(),
        ...fakeUserData(),
      },
    ];
    const [skip, limit] = [4, 2];
    const [users, count] = [resultingUsers, 10];

    let result: unknown;

    beforeAll(async () => {
      userService.list.mockResolvedValueOnce(users);
      userService.count.mockResolvedValueOnce(count);

      result = await userController.list({ skip, limit });
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it(`calls '${UserService.name}::${UserService.prototype.list.name}' with the specified 'limit' & 'skip'`, () => {
      expect(userService.list).toHaveBeenCalledTimes(1);
      expect(userService.list).toHaveBeenCalledWith(skip, limit);
    });

    it(`calls '${UserService.name}::${UserService.prototype.count.name}'`, () => {
      expect(userService.count).toHaveBeenCalledTimes(1);
    });

    it(`returns the result with extra pagination data`, () => {
      expect(result).toStrictEqual({
        total: count,
        skip,
        limit,
        users: resultingUsers.map((user) => new SerializedUser(user)),
      });
    });
  });

  describe(UserController.prototype.show.name, () => {
    it('returns the specified user', () => {
      expect(userController.show(otherUser)).toEqual(otherUser);
    });
  });

  describe(UserController.prototype.create.name, () => {
    const newUserData = fakeUserData();

    beforeAll(() => {
      userService.create.mockResolvedValue({
        _id: new ObjectId(),
        ...newUserData,
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    it(`calls '${UserService.name}::${UserService.prototype.create.name}' with the new user's data`, async () => {
      await userController.create(newUserData);

      expect(userService.create).toHaveBeenCalledTimes(1);
      expect(userService.create).toHaveBeenCalledWith(newUserData);
    });

    it(`returns the result of '${UserService.name}::${UserService.prototype.create.name}'`, async () => {
      const result = await userController.create(newUserData);

      expect(result).toEqual({
        _id: expect.any(ObjectId),
        ...newUserData,
      });
    });
  });

  describe(UserController.prototype.update.name, () => {
    const updatedData: UpdateUserDto = {
      firstName: 'Updated FirstName',
      lastName: 'Updated LastName',
      email: 'updated-user@email.dev',
      password: 'P@ssw0rd',
      permissions: [],
    };

    beforeAll(() => {
      userService.update.mockResolvedValue({
        ...otherUser,
        ...updatedData,
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    it(`calls '${UserService.name}::${UserService.prototype.update.name}' with the specified user's id & the user's updated data`, async () => {
      await userController.update(otherUser, updatedData);

      expect(userService.update).toHaveBeenCalledTimes(1);
      expect(userService.update).toHaveBeenCalledWith(
        otherUser._id,
        updatedData,
      );
    });

    it(`returns the result of '${UserService.name}::${UserService.prototype.update.name}'`, async () => {
      const result = await userController.update(otherUser, updatedData);

      expect(result).toEqual({
        ...otherUser,
        ...updatedData,
      });
    });
  });

  describe(UserController.prototype.delete.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it(`calls '${UserService.name}::${UserService.prototype.delete.name}' with the specified user's id`, async () => {
      await userController.delete(authenticatedUser);

      expect(userService.delete).toHaveBeenCalledTimes(1);
      expect(userService.delete).toHaveBeenCalledWith(authenticatedUser._id);
    });
  });
});
