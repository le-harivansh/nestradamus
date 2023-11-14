import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { argon2id, hash } from 'argon2';
import { Types } from 'mongoose';

import { MockOf, ModelWithId } from '@/_library/helper';
import { User } from '@/_user/schema/user.schema';
import { UserService } from '@/_user/service/user.service';

import { LocalStrategy } from './local.strategy';

describe(LocalStrategy.name, () => {
  const clearTextPassword = 'le-password';

  const userData: Pick<User, 'username' | 'password'> & {
    _id: Types.ObjectId;
  } = {
    _id: new Types.ObjectId(),
    username: 'le-user',
    password: '',
  };

  let localStrategy: LocalStrategy;

  beforeAll(async () => {
    userData.password = await hash(clearTextPassword, { type: argon2id });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: UserService,
          useValue: {
            async findOneBy(
              property: keyof ModelWithId<User>,
              username: string,
            ) {
              return property === 'username' && username === userData.username
                ? userData
                : null;
            },
          } as MockOf<UserService, 'findOneBy'>,
        },
      ],
    }).compile();

    localStrategy = module.get(LocalStrategy);
  });

  describe('validate', () => {
    it("returns the corresponding user's data when the correct credentials are provided", async () => {
      expect(
        localStrategy.validate(userData.username, clearTextPassword),
      ).resolves.toStrictEqual({
        id: userData._id.toString(),
        username: userData.username,
      });
    });

    it('throws an `UnauthorizedException` if the provided username does not exist in the database', async () => {
      expect(async () =>
        localStrategy.validate('wrong-username', clearTextPassword),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws an `UnauthorizedException` if the wrong password is provided', async () => {
      expect(async () =>
        localStrategy.validate(userData.username, 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
