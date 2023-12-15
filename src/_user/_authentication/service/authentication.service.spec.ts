import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { argon2id, hash } from 'argon2';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { newDocument } from '@/_library/helper';
import { User, UserSchema } from '@/_user/_user/schema/user.schema';
import { UserService } from '@/_user/_user/service/user.service';

import { AuthenticationService } from './authentication.service';

jest.mock('@/_user/_user/service/user.service');
jest.mock('@/_application/_logger/service/winston-logger.service');

describe('AuthenticationService', () => {
  let loggerService: jest.Mocked<WinstonLoggerService>;
  let userService: jest.Mocked<UserService>;
  let authenticationService: AuthenticationService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, WinstonLoggerService, AuthenticationService],
    }).compile();

    loggerService = module.get(WinstonLoggerService);
    userService = module.get(UserService);
    authenticationService = module.get(AuthenticationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authenticationService).toBeDefined();
  });

  describe('- when a user with the specified username exists', () => {
    const username = 'user@email.com';
    const password = 'P@ssw0rd';

    const authenticatedUser = newDocument<User>(User, UserSchema, {
      email: username,
      password: '',
    });

    beforeAll(async () => {
      authenticatedUser.set(
        'password',
        await hash(password, { type: argon2id }),
      );

      userService.findOne.mockResolvedValue(authenticatedUser);
    });

    it('returns the found user instance if it has a valid password', async () => {
      await expect(
        authenticationService.authenticateUserUsingCredentials(
          username,
          password,
        ),
      ).resolves.toBe(authenticatedUser);
    });

    it("logs the authenticated user's data", async () => {
      await authenticationService.authenticateUserUsingCredentials(
        username,
        password,
      );

      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenLastCalledWith(
        'Valid credentials provided for user',
        authenticatedUser,
      );
    });

    it('throws an `UnauthorizedException` if the provided password is invalid', async () => {
      await expect(
        authenticationService.authenticateUserUsingCredentials(
          username,
          'wrong-password',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  it('throws an `UnauthorizedException` if no user - matching the provided `username` - is found', async () => {
    userService.findOne.mockImplementation(() => {
      throw new NotFoundException();
    });
    await expect(
      authenticationService.authenticateUserUsingCredentials(
        'a-username',
        'a-password',
      ),
    ).rejects.toThrow(UnauthorizedException);
  });
});
