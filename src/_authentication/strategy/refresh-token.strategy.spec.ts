import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtSignOptions } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { MockOf, ModelWithId } from '@/_library/helper';
import { User } from '@/_user/schema/user.schema';
import { UserService } from '@/_user/service/user.service';

import { TokenService } from '../_token/service/token.service';
import { RefreshTokenStrategy } from './refresh-token.strategy';

describe(RefreshTokenStrategy.name, () => {
  const USER_ID_THAT_THROWS_AN_ERROR = 'id-that-throws-an-error';
  const userData: Pick<ModelWithId<User>, '_id' | 'email'> = {
    _id: new Types.ObjectId(),
    email: 'user@email.com',
  };

  let refreshTokenStrategy: RefreshTokenStrategy;

  const userService: MockOf<UserService, 'findOneBy'> = {
    findOneBy: jest.fn((property: keyof ModelWithId<User>, userId: string) => {
      if (property !== '_id') {
        throw new Error(
          'Only `_id` is accepted in this mocked `UserService::findOneBy` method.',
        );
      }

      switch (userId) {
        case userData._id.toString():
          return {
            id: userId,
            email: userData.email,
          };

        case USER_ID_THAT_THROWS_AN_ERROR:
          throw new InternalServerErrorException('Something bad happened.');

        default:
          throw new NotFoundException(
            `Could not find the user with id: ${userId}`,
          );
      }
    }),
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
    it('calls `UserService::findOneBy`', async () => {
      await refreshTokenStrategy.validate({ userId: userData._id.toString() });

      expect(userService.findOneBy).toHaveBeenCalledTimes(1);
      expect(userService.findOneBy).toHaveBeenCalledWith(
        '_id',
        userData._id.toString(),
      );
    });

    it('returns valid user data if it exists in the database', () => {
      expect(
        refreshTokenStrategy.validate({ userId: userData._id.toString() }),
      ).resolves.toStrictEqual({
        id: userData._id.toString(),
        email: userData.email,
      });
    });

    it('returns `null` if the queried user does not exist in the database', async () => {
      const validationResponse = await refreshTokenStrategy.validate({
        userId: 'non-existent-user-id',
      });

      expect(validationResponse).toBeNull();
    });

    it("re-throws any exception - that is not a `NotFoundException` - that occurs when retrieving the user's data", () => {
      expect(
        async () =>
          await refreshTokenStrategy.validate({
            userId: USER_ID_THAT_THROWS_AN_ERROR,
          }),
      ).rejects.toThrow();
    });
  });
});
