import { UnauthorizedException } from '@nestjs/common';
import { JwtSignOptions } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { MockOf, ModelWithId } from '@/_library/helper';
import { User } from '@/_user/schema/user.schema';
import { UserService } from '@/_user/service/user.service';

import { TokenService } from '../_token/service/token.service';
import { AccessTokenStrategy } from './access-token.strategy';

describe(AccessTokenStrategy.name, () => {
  let accessTokenStrategy: AccessTokenStrategy;

  const userData: Pick<ModelWithId<User>, '_id' | 'email'> = {
    _id: new Types.ObjectId(),
    email: 'user@email.com',
  };

  const userService: MockOf<UserService, 'findOneBy'> = {
    findOneBy: jest.fn((property: keyof ModelWithId<User>, userId: string) =>
      property === '_id' && userId === userData._id.toString()
        ? {
            id: userId,
            email: userData.email,
          }
        : null,
    ),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessTokenStrategy,
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

    accessTokenStrategy = module.get(AccessTokenStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('calls `UserService::findOneBy`', async () => {
      await accessTokenStrategy.validate({ userId: userData._id.toString() });

      expect(userService.findOneBy).toHaveBeenCalledTimes(1);
      expect(userService.findOneBy).toHaveBeenCalledWith(
        '_id',
        userData._id.toString(),
      );
    });

    it('returns valid user data if it exists in the database', () => {
      expect(
        accessTokenStrategy.validate({ userId: userData._id.toString() }),
      ).resolves.toStrictEqual({
        id: userData._id.toString(),
        email: userData.email,
      });
    });

    it('throws a `NotFoundException` if the queried user does not exist in the database', () => {
      expect(
        accessTokenStrategy.validate({ userId: 'invalid-user-id' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
