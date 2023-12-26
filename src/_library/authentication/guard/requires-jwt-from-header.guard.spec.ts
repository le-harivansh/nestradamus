import {
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { HydratedDocument, Types } from 'mongoose';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { newDocument } from '@/_library/test.helper';
import { User, UserSchema } from '@/_user/_user/schema/user.schema';

import type { RequestPropertyStoringAuthenticatedEntity } from '../type';
import { JwtType } from '../type';
import { RequiresJwtFromHeader } from './requires-jwt-from-header.guard';

jest.mock('@/_application/_logger/service/winston-logger.service');

describe(RequiresJwtFromHeader.name, () => {
  const user = newDocument<User>(User, UserSchema, {
    username: 'user@email.com',
    password: 'P@ssw0rd',
  });
  const jwtType: JwtType = 'access-token';
  const jwtHttpHeader = 'user.access-token';
  const requestPropertyHoldingAuthenticatableEntity: RequestPropertyStoringAuthenticatedEntity =
    'user';

  @Injectable()
  class RequiresUserAccessTokenJwtFromHeader extends RequiresJwtFromHeader<User> {
    constructor(loggerService: WinstonLoggerService) {
      super(
        jwtType,
        jwtHttpHeader,
        requestPropertyHoldingAuthenticatableEntity,
        loggerService,
      );
    }

    override getAuthenticatableEntity(): Promise<HydratedDocument<User>> {
      return Promise.resolve(user);
    }

    override validateAuthenticationJwt(): Types.ObjectId {
      return user._id;
    }
  }

  let loggerService: jest.Mocked<WinstonLoggerService>;
  let jwtGuard: RequiresUserAccessTokenJwtFromHeader;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WinstonLoggerService, RequiresUserAccessTokenJwtFromHeader],
    }).compile();

    loggerService = module.get(WinstonLoggerService);
    jwtGuard = module.get(RequiresUserAccessTokenJwtFromHeader);
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
          { type: jwtType, header: jwtHttpHeader },
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
        jest
          .spyOn(jwtGuard, 'validateAuthenticationJwt')
          .mockImplementation(() => {
            throw new Error(errorMessage);
          });
      });

      afterAll(() => {
        jest.restoreAllMocks();
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
          type: jwtType,
          jwt,
          error: errorMessage,
        });
      });
    });

    describe('when the user cannot be found in the database', () => {
      const jwt = 'authentication-jwt';
      const errorMessage = `Could not find the document with id: ${user._id}`;
      const mockedExecutionContext = () =>
        ({
          switchToHttp: () => ({
            getRequest: () => ({ header: () => jwt }),
          }),
        }) as ExecutionContext;

      beforeAll(() => {
        jest
          .spyOn(jwtGuard, 'getAuthenticatableEntity')
          .mockImplementation(() => {
            throw new NotFoundException(errorMessage);
          });
      });

      afterAll(() => {
        jest.restoreAllMocks();
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
            type: jwtType,
            jwt,
            id: user._id,
            error: errorMessage,
          },
        );
      });
    });

    describe('when the provided JWT is valid and the authenticatable entity has been retrieved from the database', () => {
      const jwt = 'authentication-jwt';
      const request = { header: () => jwt } as unknown as Request;
      const mockedExecutionContext = () =>
        ({
          switchToHttp: () => ({
            getRequest: () => request,
          }),
        }) as ExecutionContext;

      beforeAll(() => {
        jest.spyOn(jwtGuard, 'validateAuthenticationJwt');
        jest.spyOn(jwtGuard, 'getAuthenticatableEntity');
      });

      afterAll(() => {
        jest.restoreAllMocks();
      });

      let result: boolean;

      beforeEach(async () => {
        result = await jwtGuard.canActivate(mockedExecutionContext());
      });

      it('calls `RequiresJwtFromHeader::validateAuthenticationJwt` with the JWT type and the JWT', () => {
        expect(jwtGuard.validateAuthenticationJwt).toHaveBeenCalledTimes(1);
        expect(jwtGuard.validateAuthenticationJwt).toHaveBeenCalledWith(jwt);
      });

      it('calls `RequiresJwtFromHeader::getAuthenticatableEntity` with the decrypted document-id of the authenticatable entity', () => {
        expect(jwtGuard.getAuthenticatableEntity).toHaveBeenCalledTimes(1);
        expect(jwtGuard.getAuthenticatableEntity).toHaveBeenCalledWith(
          user._id,
        );
      });

      it('returns true', () => {
        expect(result).toBe(true);
      });

      it(`adds the authenticated user to the '${requestPropertyHoldingAuthenticatableEntity}' property of the 'request' object`, () => {
        expect(
          request[requestPropertyHoldingAuthenticatableEntity as keyof Request],
        ).toBe(user);
      });

      it('logs data about the successful access-token validation', () => {
        expect(loggerService.log).toHaveBeenCalledTimes(1);
        expect(loggerService.log).toHaveBeenCalledWith('JWT validated', {
          type: jwtType,
          jwt,
          authenticatedEntity: user,
        });
      });
    });
  });
});
