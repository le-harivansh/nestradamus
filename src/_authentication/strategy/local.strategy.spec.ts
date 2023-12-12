import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { argon2id, hash } from 'argon2';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { newDocument } from '@/_library/helper';
import { User, UserDocument, UserSchema } from '@/_user/schema/user.schema';
import { UserService } from '@/_user/service/user.service';

import { LocalStrategy } from './local.strategy';

jest.mock('@/_application/_logger/service/winston-logger.service');
jest.mock('@/_user/service/user.service');

describe(LocalStrategy.name, () => {
  const clearTextPassword = 'P@ssw0rd-1';
  const user = newDocument<User>(User, UserSchema, {
    email: 'user@email.com',
    password: 'P@ssw0rd',
  });

  let userService: jest.Mocked<UserService>;
  let loggerService: jest.Mocked<WinstonLoggerService>;
  let localStrategy: LocalStrategy;

  beforeAll(async () => {
    user.set('password', await hash(clearTextPassword, { type: argon2id }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [WinstonLoggerService, UserService, LocalStrategy],
    }).compile();

    userService = module.get(UserService);
    loggerService = module.get(WinstonLoggerService);
    localStrategy = module.get(LocalStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    beforeAll(() => {
      userService.findOne.mockResolvedValue(user);
    });

    describe('[on success]', () => {
      let validationResult: UserDocument | null;

      beforeEach(async () => {
        validationResult = await localStrategy.validate(
          user.email,
          clearTextPassword,
        );
      });

      it('returns the corresponding user document when the correct credentials are provided', () => {
        expect(validationResult).toBe(user);
      });

      it('calls `WinstonLoggerService::log` with the authenticated user', () => {
        expect(loggerService.log).toHaveBeenCalledTimes(1);
        expect(loggerService.log).toHaveBeenCalledWith(
          'Successful user login attempt',
          validationResult,
        );
      });
    });

    describe('[on failure]', () => {
      describe('- wrong email', () => {
        const email = 'unknown@email.com';

        beforeAll(() => {
          userService.findOne.mockImplementation(() => {
            throw new NotFoundException();
          });
        });

        it('returns null if the specified user cannot not be retrieved', async () => {
          await expect(
            localStrategy.validate(email, clearTextPassword),
          ).resolves.toBeNull();
        });

        it('calls `WinstonLoggerService::log` with the attempted user email address', async () => {
          await localStrategy.validate(email, clearTextPassword);

          expect(loggerService.log).toHaveBeenCalledTimes(1);
          expect(loggerService.log).toHaveBeenCalledWith(
            'Unsuccessful user login attempt',
            { email },
          );
        });
      });

      describe('- wrong password', () => {
        beforeEach(() => {
          userService.findOne.mockResolvedValue(user);
        });

        it('returns null if the specified user was retrieved, but the provided password is wrong', async () => {
          await expect(
            localStrategy.validate(user.get('email'), 'incorrect-password'),
          ).resolves.toBeNull();
        });

        it("re-throws any exception - that is not a `NotFoundException` - that occurs when retrieving the user's data", async () => {
          userService.findOne.mockImplementationOnce(() => {
            throw new Error();
          });

          await expect(() =>
            localStrategy.validate(user.get('email'), clearTextPassword),
          ).rejects.toThrow();
        });

        it('calls `WinstonLoggerService::log` with the attempted user email address', async () => {
          await localStrategy.validate(user.get('email'), 'incorrect-password');

          expect(loggerService.log).toHaveBeenCalledTimes(1);
          expect(loggerService.log).toHaveBeenCalledWith(
            'Unsuccessful user login attempt',
            { email: user.get('email') },
          );
        });
      });
    });
  });
});
