import { Test, TestingModule } from '@nestjs/testing';
import { argon2id, hash } from 'argon2';
import { ObjectId } from 'mongodb';

import { RequestUser } from '../../user/schema/user.schema';
import { UserService } from '../../user/service/user.service';
import { AuthenticationService } from './authentication.service';

describe(AuthenticationService.name, () => {
  const requestUser: RequestUser = {
    id: new ObjectId().toString(),
    username: 'OneTwo',
  };
  const userPassword = 'onetwo';

  let authenticationService: AuthenticationService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: UserService,
          useValue: {
            async findByUsername(username: string) {
              switch (username) {
                case requestUser.username:
                  return {
                    username: requestUser.username,
                    password: await hash(userPassword, { type: argon2id }),
                  };

                default:
                  return undefined;
              }
            },
          },
        },
        AuthenticationService,
      ],
    }).compile();

    authenticationService = module.get(AuthenticationService);
  });

  describe('credentialsAreValid', () => {
    it('returns true if correct user-credentials are passed', async () => {
      expect(
        authenticationService.credentialsAreValid(
          requestUser.username,
          userPassword,
        ),
      ).resolves.toBe(true);
    });

    it('returns false if an incorrect username is passed', async () => {
      expect(
        authenticationService.credentialsAreValid(
          'invalid-username',
          userPassword,
        ),
      ).resolves.toBe(false);
    });

    it('returns false if an incorrect password is passed', async () => {
      expect(
        authenticationService.credentialsAreValid(
          requestUser.username,
          'wrong-password',
        ),
      ).resolves.toBe(false);
    });
  });
});
