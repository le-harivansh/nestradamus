import { Test, TestingModule } from '@nestjs/testing';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { newDocument } from '@/_library/helper';

import { UpdateUserDto } from '../dto/update-user.dto';
import { User, UserDocument, UserSchema } from '../schema/user.schema';
import { UserService } from '../service/user.service';
import { UserController } from './user.controller';

jest.mock('../service/user.service');
jest.mock('@/_application/_logger/service/winston-logger.service');

describe(UserController.name, () => {
  const user = newDocument<User>(User, UserSchema, {
    email: 'user@email.com',
    password: 'P@ssw0rd',
  });

  let loggerService: jest.Mocked<WinstonLoggerService>;
  let userService: jest.Mocked<UserService>;
  let userController: UserController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [WinstonLoggerService, UserService],
    }).compile();

    loggerService = module.get(WinstonLoggerService);
    userService = module.get(UserService);
    userController = module.get(UserController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
  });

  describe('get', () => {
    let currentlyAuthenticatedUser: UserDocument;

    beforeEach(() => {
      currentlyAuthenticatedUser = userController.get(user);
    });

    it('returns the authenticated user', () => {
      expect(currentlyAuthenticatedUser).toStrictEqual(user);
    });

    it('logs data about the authenticated user', () => {
      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Request to get authenticated user',
        currentlyAuthenticatedUser,
      );
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      email: 'user@email.com',
      password: 'P@ssw0rd',
    };
    const updatedUser = user
      .$clone()
      .set('email', updateUserDto.email)
      .set('password', updateUserDto.password);

    beforeAll(() => {
      userService.update.mockResolvedValue(updatedUser);
    });

    let updateResult: any;

    beforeEach(async () => {
      updateResult = await userController.update(user, updateUserDto);
    });

    it('calls `UserService::update`', () => {
      expect(userService.update).toHaveBeenCalledTimes(1);
      expect(userService.update).toHaveBeenCalledWith(user._id, updateUserDto);
    });

    it("returns the updated user's data", () => {
      expect(updateResult).toStrictEqual(updatedUser);
    });

    it('logs data about the update request', () => {
      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith('Request to update user', {
        user,
        data: updateUserDto,
      });
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await userController.delete(user);
    });

    it('calls `UserService::delete`', () => {
      expect(userService.delete).toHaveBeenCalledTimes(1);
      expect(userService.delete).toHaveBeenCalledWith(user._id);
    });

    it('logs data about the delete request', () => {
      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Request to delete user',
        user,
      );
    });
  });
});
