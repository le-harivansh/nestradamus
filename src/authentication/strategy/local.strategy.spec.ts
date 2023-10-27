import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { UserService } from '../../user/service/user.service';
import { AuthenticationService } from '../service/authentication.service';
import { LocalStrategy } from './local.strategy';

describe(LocalStrategy.name, () => {
  const userData = {
    id: new Types.ObjectId(),
    username: 'le-user',
    password: 'le-password',
  };

  let localStrategy: LocalStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthenticationService,
          useValue: {
            credentialsAreValid: (username: string, password: string) =>
              username === userData.username && password === userData.password,
          },
        },
        {
          provide: UserService,
          useValue: {
            async findByUsername(username: string) {
              return username === userData.username
                ? { _id: userData.id, username: userData.username }
                : null;
            },
          },
        },
      ],
    }).compile();

    localStrategy = module.get(LocalStrategy);
  });

  describe('validate', () => {
    it("returns the corresponding user's data when the correct credentials are provided", async () => {
      expect(
        localStrategy.validate(userData.username, userData.password),
      ).resolves.toStrictEqual({
        id: userData.id.toString(),
        username: userData.username,
      });
    });

    it('throws an unauthorized exception when incorrect credentials are provided', async () => {
      expect(async () =>
        localStrategy.validate('wrong_username', 'wrong_password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
