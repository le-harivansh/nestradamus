import { UnauthorizedException } from '@nestjs/common';
import { JwtSignOptions } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { User } from '../../user/schema/user.schema';
import { UserService } from '../../user/service/user.service';
import { TokenService } from '../token/token.service';
import { RefreshTokenStrategy } from './refresh-token.strategy';

describe(RefreshTokenStrategy.name, () => {
  let refreshTokenStrategy: RefreshTokenStrategy;

  const userData: Pick<User, 'username'> & { _id: Types.ObjectId } = {
    _id: new Types.ObjectId(),
    username: 'le-username',
  };

  const userService = {
    findById: jest.fn((userId: string) =>
      userId === userData._id.toString()
        ? {
            id: userId,
            username: userData.username,
          }
        : null,
    ),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenStrategy,
        {
          provide: TokenService,
          useValue: {
            getSecret: () => 'token-secret',
            JWT_ISSUER: 'jwt-issuer',
            JWT_AUDIENCE: 'jwt-audience',
            JWT_ALGORITHM: 'HS512' as JwtSignOptions['algorithm'],
          },
        },
        {
          provide: UserService,
          useValue: userService,
        },
      ],
    }).compile();

    refreshTokenStrategy = module.get(RefreshTokenStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('calls `UserService::findById`', async () => {
      await refreshTokenStrategy.validate({ userId: userData._id.toString() });

      expect(userService.findById).toHaveBeenCalledTimes(1);
      expect(userService.findById).toHaveBeenCalledWith(
        userData._id.toString(),
      );
    });

    it('returns valid user data if it exists in the database', () => {
      expect(
        refreshTokenStrategy.validate({ userId: userData._id.toString() }),
      ).resolves.toStrictEqual({
        id: userData._id.toString(),
        username: userData.username,
      });
    });

    it('throws a `NotFoundException` if the queried user does not exist in the database', () => {
      expect(
        refreshTokenStrategy.validate({ userId: 'invalid-user-id' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
