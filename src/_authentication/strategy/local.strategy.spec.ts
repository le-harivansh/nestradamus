import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { argon2id, hash } from 'argon2';
import { Types, model } from 'mongoose';

import { MockOf, ModelWithId } from '@/_library/helper';
import { User, UserSchema } from '@/_user/schema/user.schema';
import { UserService } from '@/_user/service/user.service';

import { LocalStrategy } from './local.strategy';

describe(LocalStrategy.name, () => {
  const clearTextPassword = 'le-password';

  const UserModel = model(User.name, UserSchema);
  const userDocument = new UserModel({
    _id: new Types.ObjectId(),
    email: 'user@email.com',
    password: 'P@ssw0rd',
  });

  let localStrategy: LocalStrategy;

  beforeAll(async () => {
    userDocument.set(
      'password',
      await hash(clearTextPassword, { type: argon2id }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: UserService,
          useValue: {
            async findOneBy(property: keyof ModelWithId<User>, value: string) {
              if (property === 'email' && value === userDocument.get('email')) {
                return Promise.resolve(userDocument);
              }

              throw new NotFoundException();
            },
          } as MockOf<UserService, 'findOneBy'>,
        },
      ],
    }).compile();

    localStrategy = module.get(LocalStrategy);
  });

  describe('validate', () => {
    it('returns the corresponding user document when the correct credentials are provided', async () => {
      expect(
        localStrategy.validate(userDocument.email, clearTextPassword),
      ).resolves.toBe(userDocument);
    });

    it('returns `null` if the user could not be retrieved from the database', async () => {
      expect(
        localStrategy.validate('wrong@email.com', clearTextPassword),
      ).resolves.toBeNull();
    });

    it('returns `null` if the wrong password is provided', async () => {
      expect(
        localStrategy.validate(userDocument.get('email'), 'wrong-password'),
      ).resolves.toBeNull();
    });
  });
});
