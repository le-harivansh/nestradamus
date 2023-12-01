import { Test, TestingModule } from '@nestjs/testing';
import { Types, model } from 'mongoose';

import { MockOf } from '@/_library/helper';

import { UpdateUserDto } from '../dto/update-user.dto';
import { User, UserSchema } from '../schema/user.schema';
import { UserService } from '../service/user.service';
import { UserController } from './user.controller';

describe(UserController.name, () => {
  const UserModel = model(User.name, UserSchema);
  const updatedUser = new UserModel({
    _id: new Types.ObjectId(),
    email: 'user@email.com',
  });

  const userService: MockOf<UserService, 'update' | 'delete'> = {
    update: jest.fn(() => Promise.resolve(updatedUser)),
    delete: jest.fn(() => Promise.resolve()),
  };

  let userController: UserController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: userService,
        },
      ],
    }).compile();

    userController = module.get(UserController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
  });

  describe('get', () => {
    const user = new UserModel({
      _id: new Types.ObjectId(),
      email: 'user@email.com',
    });

    it('returns the authenticated user', () => {
      expect(userController.get(user)).toStrictEqual(user);
    });
  });

  describe('update', () => {
    const userId = new Types.ObjectId();
    const updateUserDto: UpdateUserDto = {
      email: 'user@email.com',
      password: 'P@ssw0rd',
    };

    let updateResult: any;

    beforeEach(async () => {
      updateResult = await userController.update(userId, updateUserDto);
    });

    it('calls `UserService::update`', () => {
      expect(userService.update).toHaveBeenCalledTimes(1);
      expect(userService.update).toHaveBeenCalledWith(userId, updateUserDto);
    });

    it("returns the updated user's data", () => {
      expect(updateResult).toStrictEqual(updatedUser);
    });
  });

  describe('delete', () => {
    const userId = new Types.ObjectId();

    beforeEach(async () => {
      await userController.delete(userId);
    });

    it('calls `UserService::delete`', () => {
      expect(userService.delete).toHaveBeenCalledTimes(1);
      expect(userService.delete).toHaveBeenCalledWith(userId);
    });
  });
});
