import { Test, TestingModule } from '@nestjs/testing';
import { HydratedDocument } from 'mongoose';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { newDocument } from '@/_library/test.helper';
import { User, UserSchema } from '@/_user/_user/schema/user.schema';
import { UserService } from '@/_user/_user/service/user.service';

import { AuthenticationService } from './authentication.service';

jest.mock('@/_user/_user/service/user.service');
jest.mock('@/_application/_logger/service/winston-logger.service');

describe(AuthenticationService.name, () => {
  let userService: jest.Mocked<UserService>;
  let authenticationService: AuthenticationService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, WinstonLoggerService, AuthenticationService],
    }).compile();

    userService = module.get(UserService);
    authenticationService = module.get(AuthenticationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authenticationService).toBeDefined();
  });

  describe('retrieveAuthenticatableEntity', () => {
    const username = 'user@email.com';
    let user: HydratedDocument<User>;

    beforeAll(() => {
      user = newDocument<User>(User, UserSchema, {
        username,
        password: 'P@ssw0rd',
      });

      userService.findOne.mockResolvedValue(user);
    });

    it('calls `UserService::findOne` with the provided `username` parameter', async () => {
      await authenticationService.retrieveAuthenticatableEntity(username);

      expect(userService.findOne).toHaveBeenCalledTimes(1);
      expect(userService.findOne).toHaveBeenCalledWith({ username });
    });

    it('returns the retrieved authenticated user', async () => {
      await expect(
        authenticationService.retrieveAuthenticatableEntity(username),
      ).resolves.toBe(user);
    });
  });
});
