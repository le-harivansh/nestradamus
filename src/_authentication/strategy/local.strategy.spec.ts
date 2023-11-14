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

  const userData: Pick<ModelWithId<User>, '_id' | 'email' | 'password'> = {
    _id: new Types.ObjectId(),
    email: 'user@email.com',
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
            async findOneBy(property: keyof ModelWithId<User>, value: string) {
              return property === 'email' && value === userData.email
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
        localStrategy.validate(userData.email, clearTextPassword),
      ).resolves.toStrictEqual({
        id: userData._id.toString(),
        email: userData.email,
      });
    });

    it('throws an `UnauthorizedException` if the provided username does not exist in the database', async () => {
      expect(async () =>
        localStrategy.validate('wrong@email.com', clearTextPassword),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws an `UnauthorizedException` if the wrong password is provided', async () => {
      expect(async () =>
        localStrategy.validate(userData.email, 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
