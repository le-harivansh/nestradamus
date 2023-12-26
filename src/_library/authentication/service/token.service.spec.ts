import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { User } from '@/_user/_user/schema/user.schema';

import { AuthenticationJwtPayload } from '../type';
import { TokenService } from './token.service';

jest.mock('@nestjs/jwt');
jest.mock('@/_application/_configuration/service/configuration.service');
jest.mock('@/_application/_logger/service/winston-logger.service');

describe(TokenService.name, () => {
  const jwtOptions: Readonly<
    Required<Pick<JwtSignOptions, 'issuer' | 'audience'>>
  > = {
    issuer: 'application',
    audience: 'application',
  };

  @Injectable()
  class UserTokenService extends TokenService<User> {
    constructor(jwtService: JwtService, loggerService: WinstonLoggerService) {
      super(jwtService, jwtOptions, loggerService);
    }

    override generateAuthenticationJwt(): {
      token: string;
      expiresAt: number;
    } {
      return { token: 'token', expiresAt: Date.now() };
    }

    override validateAuthenticationJwt(): AuthenticationJwtPayload {
      return { id: new Types.ObjectId().toString() };
    }
  }

  let loggerService: jest.Mocked<WinstonLoggerService>;
  let jwtService: jest.Mocked<JwtService>;
  let tokenService: UserTokenService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WinstonLoggerService, JwtService, UserTokenService],
    }).compile();

    loggerService = module.get(WinstonLoggerService);
    jwtService = module.get(JwtService);
    tokenService = module.get(UserTokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(tokenService).toBeDefined();
  });

  describe('generateJwt', () => {
    const payload: AuthenticationJwtPayload = {
      id: new Types.ObjectId().toString(),
    };
    const tokenGenerationOptions = {
      durationMs: 15 * 60 * 1000,
      secret: 'jwt-secret',
    };
    const jwtToken = 'jwt-token';

    beforeAll(() => {
      jwtService.sign.mockReturnValue(jwtToken);
    });

    let result: { token: string; expiresAt: number };

    beforeEach(() => {
      result = tokenService['generateJwt'](payload, tokenGenerationOptions);
    });

    it('calls `JwtService::sign` with the payload and JWT options', () => {
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(payload, {
        algorithm: TokenService.JWT_ALGORITHM,
        ...jwtOptions,
        secret: tokenGenerationOptions.secret,
        notBefore: 0,
        expiresIn: Math.floor(tokenGenerationOptions.durationMs / 1000),
      });
    });

    it('calls `WinstonLoggerService::log` with the appropriate message and arguments', () => {
      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith('JWT generated', {
        payload,
      });
    });

    it('returns the token, and its expiration timestamp', () => {
      expect(result).toStrictEqual({
        token: jwtToken,
        expiresAt: expect.any(Number),
      });

      expect(Math.floor(result.expiresAt / 1000)).toBe(
        Math.floor(
          (Date.now() +
            Math.floor(tokenGenerationOptions.durationMs / 1000) * 1000) /
            1000,
        ),
      );
    });
  });

  describe('validateJwt', () => {
    const decryptedJwt = {
      id: new Types.ObjectId().toString(),
    };
    const jwt = 'the-jwt-to-validate';
    const secret = 'jwt-secret';

    beforeAll(() => {
      jwtService.verify.mockReturnValue(decryptedJwt);
    });

    let result: unknown;

    beforeEach(() => {
      result = tokenService['validateJwt'](jwt, secret);
    });

    it('calls `JwtService::verify` with the appropriate arguments', () => {
      expect(jwtService.verify).toHaveBeenCalledTimes(1);
      expect(jwtService.verify).toHaveBeenCalledWith(jwt, {
        algorithms: [TokenService.JWT_ALGORITHM],
        issuer: jwtOptions.issuer,
        audience: jwtOptions.audience,
        secret,
      });
    });

    it('logs the jwt and payload data', () => {
      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith('Validated JWT', {
        jwt,
        decryptedJwt,
      });
    });

    it('returns the decrypted JWT object', () => {
      expect(result).toBe(decryptedJwt);
    });
  });
});
