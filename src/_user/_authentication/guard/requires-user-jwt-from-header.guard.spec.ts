import {
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { Types } from 'mongoose';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { newDocument } from '@/_library/helper';
import { User, UserSchema } from '@/_user/_user/schema/user.schema';
import { UserService } from '@/_user/_user/service/user.service';

import { Type } from '../_token/constant';
import { TokenService } from '../_token/service/token.service';
import { JwtHttpHeader } from '../constant';
import { RequiresUserJwtFromHeader } from './requires-user-jwt-from-header.guard';

jest.mock('@/_application/_logger/service/winston-logger.service');
jest.mock('@/_user/_user/service/user.service');
jest.mock('../_token/service/token.service');

describe(RequiresUserJwtFromHeader.name, () => {
  describe.each<{ type: Type; httpHeader: JwtHttpHeader }>([
    {
      type: Type.USER_ACCESS_TOKEN,
      httpHeader: JwtHttpHeader.USER_ACCESS_TOKEN,
    },
    {
      type: Type.USER_REFRESH_TOKEN,
      httpHeader: JwtHttpHeader.USER_REFRESH_TOKEN,
    },
  ])('[type: $type, httpHeader: $httpHeader]', ({ type, httpHeader }) => {
    @Injectable()
    class RequiresUserJwt extends RequiresUserJwtFromHeader {
      constructor(
        userService: UserService,
        tokenService: TokenService,
        loggerService: WinstonLoggerService,
      ) {
        super(type, httpHeader, userService, tokenService, loggerService);
      }
    }

    let loggerService: jest.Mocked<WinstonLoggerService>;
    let userService: jest.Mocked<UserService>;
    let tokenService: jest.Mocked<TokenService>;
    let jwtGuard: RequiresUserJwt;

    beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          WinstonLoggerService,
          UserService,
          TokenService,
          RequiresUserJwt,
        ],
      }).compile();

      loggerService = module.get(WinstonLoggerService);
      userService = module.get(UserService);
      tokenService = module.get(TokenService);
      jwtGuard = module.get(RequiresUserJwt);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should be defined', () => {
      expect(jwtGuard).toBeDefined();
    });

    describe('canActivate', () => {
      describe('when the JWT is not present in the header', () => {
        const mockedExecutionContext = () =>
          ({
            switchToHttp: () => ({
              getRequest: () => ({ header: () => undefined }),
            }),
          }) as ExecutionContext;

        it('throws an `UnauthorizedException`', async () => {
          await expect(() =>
            jwtGuard.canActivate(mockedExecutionContext()),
          ).rejects.toThrow(UnauthorizedException);
        });

        it('logs data about the absence of the header', async () => {
          try {
            await jwtGuard.canActivate(mockedExecutionContext());
          } catch {
            // intentionally left blank
          }

          expect(loggerService.log).toHaveBeenCalledTimes(1);
          expect(loggerService.log).toHaveBeenCalledWith(
            'Http header not present on the request',
            { type, header: httpHeader },
          );
        });
      });

      describe('when the provided JWT is invalid', () => {
        const jwt = 'authentication-jwt';
        const mockedExecutionContext = () =>
          ({
            switchToHttp: () => ({
              getRequest: () => ({ header: () => jwt }),
            }),
          }) as ExecutionContext;
        const errorMessage = 'The JWT has expired.';

        beforeAll(() => {
          tokenService.validateAuthenticationJwt.mockImplementation(() => {
            throw new Error(errorMessage);
          });
        });

        it('throws an `UnauthorizedException`', async () => {
          await expect(() =>
            jwtGuard.canActivate(mockedExecutionContext()),
          ).rejects.toThrow(UnauthorizedException);
        });

        it('logs data about the validation error', async () => {
          try {
            await jwtGuard.canActivate(mockedExecutionContext());
          } catch {
            // intentionally left blank
          }

          expect(loggerService.log).toHaveBeenCalledTimes(1);
          expect(loggerService.log).toHaveBeenCalledWith('Invalid JWT', {
            type,
            jwt,
            error: errorMessage,
          });
        });
      });

      describe('when the user cannot be found in the database', () => {
        const authenticatedUserId = new Types.ObjectId().toString();
        const jwt = 'authentication-jwt';
        const mockedExecutionContext = () =>
          ({
            switchToHttp: () => ({
              getRequest: () => ({ header: () => jwt }),
            }),
          }) as ExecutionContext;

        beforeAll(() => {
          tokenService.validateAuthenticationJwt.mockReturnValue({
            id: authenticatedUserId,
          });

          userService.findOne.mockImplementation(() => {
            throw new NotFoundException();
          });
        });

        it('throws an `UnauthorizedException`', async () => {
          await expect(() =>
            jwtGuard.canActivate(mockedExecutionContext()),
          ).rejects.toThrow(UnauthorizedException);
        });

        it('logs data about the validation error', async () => {
          try {
            await jwtGuard.canActivate(mockedExecutionContext());
          } catch {
            // intentionally left blank
          }

          expect(loggerService.log).toHaveBeenCalledTimes(1);
          expect(loggerService.log).toHaveBeenCalledWith(
            'Could not retrieve user from database',
            {
              type,
              jwt,
              id: authenticatedUserId,
            },
          );
        });
      });

      describe('when the provided JWT is valid and the user has been retrieved from the database', () => {
        const authenticatedUser = newDocument<User>(User, UserSchema, {
          email: 'user@email.com',
          password: 'P@ssw0rd',
        });
        const jwt = 'authentication-jwt';
        const request = { header: () => jwt } as unknown as Request;
        const mockedExecutionContext = () =>
          ({
            switchToHttp: () => ({
              getRequest: () => request,
            }),
          }) as ExecutionContext;

        beforeAll(() => {
          tokenService.validateAuthenticationJwt.mockReturnValue({
            id: authenticatedUser._id.toString(),
          });

          userService.findOne.mockResolvedValue(authenticatedUser);
        });

        let result: boolean;

        beforeEach(async () => {
          result = await jwtGuard.canActivate(mockedExecutionContext());
        });

        it('returns true', () => {
          expect(result).toBe(true);
        });

        it('adds the authenticated user to the `user` property of the `request` object', () => {
          expect(request.user).toBe(authenticatedUser);
        });

        it('logs data about the successful access-token validation', () => {
          expect(loggerService.log).toHaveBeenCalledTimes(1);
          expect(loggerService.log).toHaveBeenCalledWith('JWT validated', {
            type,
            jwt,
            user: authenticatedUser,
          });
        });
      });
    });
  });
});
