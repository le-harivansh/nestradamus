import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from 'mongodb';

import { User } from '../../user/schema/user.schema';
import { UserService } from '../../user/service/user.service';
import { RefreshTokenStrategy } from './refresh-token.strategy';

/**
 * @todo: fix tests.
 */

describe(RefreshTokenStrategy.name, () => {
  let refreshTokenStrategy: RefreshTokenStrategy;

  const user: Pick<User, 'username'> & { _id: string } = {
    _id: new ObjectId().toJSON(),
    username: 'le-username',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenStrategy,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => key,
          },
        },
        {
          provide: UserService,
          useValue: {
            findById: (userId: string) => (userId === user._id ? user : null),
          },
        },
      ],
    }).compile();

    refreshTokenStrategy = module.get(RefreshTokenStrategy);
  });

  describe('validate', () => {
    it('returns valid user data', async () => {
      expect(
        refreshTokenStrategy.validate({ userId: user._id }),
      ).resolves.toStrictEqual({
        id: user._id,
        username: user.username,
      });
    });
  });
});
