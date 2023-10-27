import { Test, TestingModule } from '@nestjs/testing';
import { argon2id, hash } from 'argon2';

import { UserService } from '../../_user/service/user.service';
import { AuthenticationService } from './authentication.service';

describe(AuthenticationService.name, () => {
  const plainUserPassword = 'one-two-password';
  const userCredentials = {
    username: 'one-two',
    password: '', // `plainUserPassword` is hashed and the result is assigned to this in `beforeAll`
  };

  const userService = {
    findByUsername: jest.fn((username: string) =>
      username === userCredentials.username ? userCredentials : undefined,
    ),
  };

  let authenticationService: AuthenticationService;

  beforeAll(async () => {
    userCredentials.password = await hash(plainUserPassword, {
      type: argon2id,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: UserService,
          useValue: userService,
        },
        AuthenticationService,
      ],
    }).compile();

    authenticationService = module.get(AuthenticationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('credentialsAreValid', () => {
    it('calls `UserService::findByUsername` with the provided username', async () => {
      await authenticationService.credentialsAreValid(
        userCredentials.username,
        plainUserPassword,
      );

      expect(userService.findByUsername).toHaveBeenCalledTimes(1);
      expect(userService.findByUsername).toHaveBeenCalledWith(
        userCredentials.username,
      );
    });

    it('returns true if correct user-credentials are passed', async () => {
      expect(
        authenticationService.credentialsAreValid(
          userCredentials.username,
          plainUserPassword,
        ),
      ).resolves.toBe(true);
    });

    it('returns false if an incorrect username is passed', async () => {
      expect(
        authenticationService.credentialsAreValid(
          'incorrect-username',
          plainUserPassword,
        ),
      ).resolves.toBe(false);
    });

    it('returns false if an incorrect password is passed', async () => {
      expect(
        authenticationService.credentialsAreValid(
          userCredentials.username,
          'incorrect-password',
        ),
      ).resolves.toBe(false);
    });
  });
});
