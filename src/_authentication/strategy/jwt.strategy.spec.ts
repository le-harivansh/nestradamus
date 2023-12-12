import { Injectable, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { newDocument } from '@/_library/helper';
import { User, UserDocument, UserSchema } from '@/_user/schema/user.schema';
import { UserService } from '@/_user/service/user.service';

import { TokenService } from '../_token/service/token.service';
import { Guard, JwtType, TokenHttpHeader } from '../constant';
import { JwtStrategy } from './jwt.strategy';

jest.mock('@/_user/service/user.service');
jest.mock('@/_application/_logger/service/winston-logger.service');

@Injectable()
class TokenStrategy extends JwtStrategy('jwt-token' as Guard) {
  constructor(
    tokenService: TokenService,
    loggerService: WinstonLoggerService,
    userService: UserService,
  ) {
    super(
      'token-type' as JwtType,
      'jwt-token' as TokenHttpHeader,
      tokenService,
      loggerService,
      userService,
    );
  }
}

describe(JwtStrategy.name, () => {
  let loggerService: jest.Mocked<WinstonLoggerService>;
  let userService: jest.Mocked<UserService>;
  let tokenStrategy: TokenStrategy;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WinstonLoggerService,
        {
          provide: TokenService,
          useValue: {
            getSecret: () => 'token-secret',
            JWT_ISSUER: 'application',
            JWT_AUDIENCE: 'application',
            JWT_ALGORITHM: 'HS512',
          },
        },
        UserService,
        TokenStrategy,
      ],
    }).compile();

    loggerService = module.get(WinstonLoggerService);
    userService = module.get(UserService);
    tokenStrategy = module.get(TokenStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    const user = newDocument<User>(User, UserSchema, {
      email: 'user@email.com',
      password: 'P@ssw0rd',
    });

    describe('[on success]', () => {
      let result: UserDocument | null = null;

      beforeAll(() => {
        userService.findOne.mockResolvedValue(user);
      });

      beforeEach(async () => {
        result = await tokenStrategy.validate({
          userId: user._id.toString(),
        });
      });

      it('calls `UserService::findOneBy`', () => {
        expect(userService.findOne).toHaveBeenCalledTimes(1);
        expect(userService.findOne).toHaveBeenCalledWith(user._id);
      });

      it('returns valid user data if it exists in the database', () => {
        expect(result?.get('email')).toBe(user.get('email'));
      });

      it("calls `WinstonLoggerService::log` with the user's data", async () => {
        expect(loggerService.log).toHaveBeenCalledTimes(1);
        expect(loggerService.log).toHaveBeenCalledWith(
          'Token validated for user',
          user,
        );
      });
    });

    describe('[on failure]', () => {
      const userId = new Types.ObjectId().toString();

      let result: UserDocument | null = null;

      beforeEach(async () => {
        userService.findOne.mockImplementationOnce(() => {
          throw new NotFoundException();
        });

        result = await tokenStrategy.validate({ userId });
      });

      it('returns `null` if the queried user does not exist in the database', async () => {
        expect(result).toBeNull();
      });

      it("re-throws any exception - that is not a `NotFoundException` - that occurs when retrieving the user's data", async () => {
        userService.findOne.mockImplementationOnce(() => {
          throw new Error();
        });

        await expect(() =>
          tokenStrategy.validate({
            userId: user._id.toString(),
          }),
        ).rejects.toThrow();
      });

      it('calls `WinstonLoggerService::log` with the attempted user email address', async () => {
        expect(loggerService.log).toHaveBeenCalledTimes(1);
        expect(loggerService.log).toHaveBeenCalledWith(
          'Could not retrieve user',
          { id: userId },
        );
      });
    });
  });
});
