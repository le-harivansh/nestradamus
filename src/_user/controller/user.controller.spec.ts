import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { MockOf } from '@/_library/helper';

import { UpdateUserDto } from '../dto/update-user.dto';
import { RequestUser } from '../schema/user.schema';
import { UserService } from '../service/user.service';
import { UserController } from './user.controller';

describe(UserController.name, () => {
  const UPDATED_USER_DATA = Symbol('updated-user-data');

  let userController: UserController;

  const userService: MockOf<UserService, 'update' | 'delete'> = {
    update: jest.fn(() => Promise.resolve(UPDATED_USER_DATA)),
    delete: jest.fn(() => Promise.resolve()),
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
      email: 'le@user.com',
    };

    it('returns the authenticated user', () => {
      expect(userController.get(user)).toStrictEqual(user);
    });
  });

  describe('update', () => {
    const userId = new Types.ObjectId().toString();
    const updateUserDto: UpdateUserDto = {
      email: 'email-one@email.com',
      password: 'a-password',
    };
    let updateResult: any;

    beforeEach(async () => {
      updateResult = await userController.update(userId, updateUserDto);
    });

    it('calls `UserService::update`', () => {
      expect(userService.update).toHaveBeenCalledTimes(1);
      expect(userService.update).toHaveBeenCalledWith(userId, updateUserDto);
    });

    it('returns the result of `UserService::update`', () => {
      expect(updateResult).toBe(UPDATED_USER_DATA);
    });
  });

  describe('delete', () => {
    const userId = new Types.ObjectId().toString();

    beforeEach(async () => {
      await userController.delete(userId);
    });

    it('calls `UserService::delete`', () => {
      expect(userService.delete).toHaveBeenCalledTimes(1);
      expect(userService.delete).toHaveBeenCalledWith(userId);
    });
  });
});
