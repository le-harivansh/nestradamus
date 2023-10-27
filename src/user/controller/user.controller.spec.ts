import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { UpdateUserDto } from '../dto/update-user.dto';
import { RequestUser } from '../schema/user.schema';
import { UserService } from '../service/user.service';
import { UserController } from './user.controller';

describe(UserController.name, () => {
  let userController: UserController;

  const userService = {
    UPDATED_USER_DATA: Symbol('updated-user-data'),

    updateUserWithId: jest.fn(function () {
      return Promise.resolve(this.UPDATED_USER_DATA);
    }),
    deleteById: jest.fn(() => Promise.resolve()),
  };

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
    const user: RequestUser = {
      id: new Types.ObjectId().toString(),
      username: 'le-user',
    };

    it('returns the authenticated user', () => {
      expect(userController.get(user)).toStrictEqual(user);
    });
  });

  describe('update', () => {
    const userId = new Types.ObjectId().toString();
    const updateUserDto: UpdateUserDto = {
      username: 'a-username',
      password: 'a-password',
    };
    let updateResult: any;

    beforeEach(async () => {
      updateResult = await userController.update(userId, updateUserDto);
    });

    it('calls `UserService::updateUserWithId`', () => {
      expect(userService.updateUserWithId).toHaveBeenCalledTimes(1);
      expect(userService.updateUserWithId).toHaveBeenCalledWith(
        userId,
        updateUserDto,
      );
    });

    it('returns the result of `UserService::updateUserWithId`', () => {
      expect(updateResult).toBe(userService.UPDATED_USER_DATA);
    });
  });

  describe('delete', () => {
    const userId = new Types.ObjectId().toString();

    beforeEach(async () => {
      await userController.delete(userId);
    });

    it('calls `UserService::deleteById`', () => {
      expect(userService.deleteById).toHaveBeenCalledTimes(1);
      expect(userService.deleteById).toHaveBeenCalledWith(userId);
    });
  });
});
