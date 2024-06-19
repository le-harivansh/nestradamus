import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { TokenService } from './token.service';

jest.mock('@nestjs/jwt');

describe(TokenService.name, () => {
  const authenticationModuleOptions: Pick<
    AuthenticationModuleOptions,
    'jwt' | 'accessToken' | 'refreshToken'
  > = {
    jwt: {
      algorithm: 'HS512',
      issuer: 'JwtIssuer',
      audience: 'JwtAudience',
      secret: 'JwtSecret',
    },
    accessToken: {
      cookieName: 'authentication.access-token',
      expiresInSeconds: 15 * 60, // 15 minutes
    },
    refreshToken: {
      cookieName: 'authentication.refresh-token',
      expiresInSeconds: 7 * 24 * 60 * 60, // 1 week
    },
  };

  let tokenService: TokenService;
  let jwtService: jest.Mocked<JwtService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
          useValue: authenticationModuleOptions,
        },
        TokenService,
      ],
    }).compile();

    tokenService = module.get(TokenService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(tokenService).toBeDefined();
  });

  describe(
    TokenService.prototype['createAccessTokenForUserWithId'].name,
    () => {
      const userId = 'User-Id';
      const accessToken = 'Access-Token';

      let result: string;

      beforeAll(() => {
        jwtService.sign.mockReturnValueOnce(accessToken);

        result = tokenService['createAccessTokenForUserWithId'](userId);
      });

      afterAll(() => {
        jest.clearAllMocks();
      });

      it(`returns the JWT generated by '${JwtService.name}::${JwtService.prototype.sign.name}'`, () => {
        expect(result).toBe(accessToken);
      });

      it(`calls '${JwtService.name}::${JwtService.prototype.sign.name}' with the appropriate payload & options`, () => {
        expect(jwtService.sign).toHaveBeenCalledTimes(1);
        expect(jwtService.sign).toHaveBeenCalledWith(
          { id: userId },
          {
            algorithm: authenticationModuleOptions.jwt.algorithm,
            issuer: authenticationModuleOptions.jwt.issuer,
            audience: authenticationModuleOptions.jwt.audience,
            subject: TokenService['ACCESS_TOKEN_JWT_SUBJECT'],
            secret: authenticationModuleOptions.jwt.secret,
            notBefore: 0,
            expiresIn: authenticationModuleOptions.accessToken.expiresInSeconds,
          },
        );
      });
    },
  );

  describe(TokenService.prototype.validateAccessToken.name, () => {
    describe('[on success]', () => {
      const jwt = 'JWT to validate';
      const payload = { id: 'User-Id' };

      let result: string;

      beforeAll(() => {
        jwtService.verify.mockReturnValueOnce(payload);

        result = tokenService.validateAccessToken(jwt);
      });

      afterAll(() => {
        jest.clearAllMocks();
      });

      it("returns the 'id' within the payload", () => {
        expect(result).toBe(payload.id);
      });

      it(`calls '${JwtService.name}::${JwtService.prototype.verify.name}' with the appropriate JWT & options`, () => {
        expect(jwtService.verify).toHaveBeenCalledTimes(1);
        expect(jwtService.verify).toHaveBeenCalledWith(jwt, {
          algorithms: [authenticationModuleOptions.jwt.algorithm],
          issuer: authenticationModuleOptions.jwt.issuer,
          audience: authenticationModuleOptions.jwt.audience,
          subject: TokenService['ACCESS_TOKEN_JWT_SUBJECT'],
          secret: authenticationModuleOptions.jwt.secret,
        });
      });
    });

    describe('[on failure]', () => {
      beforeAll(() => {
        jwtService.verify.mockImplementationOnce(() => {
          throw new Error();
        });
      });

      afterAll(() => {
        jest.clearAllMocks();
      });

      it(`throws an '${UnauthorizedException.name}' when '${JwtService.name}::${JwtService.prototype.sign.name}' fails`, () => {
        expect(() =>
          tokenService.validateAccessToken('JWT to validate'),
        ).toThrow(UnauthorizedException);
      });
    });
  });

  describe(
    TokenService.prototype['createRefreshTokenForUserWithId'].name,
    () => {
      const userId = 'User-Id';
      const refreshToken = 'Refresh-Token';

      let result: string;

      beforeAll(() => {
        jwtService.sign.mockReturnValueOnce(refreshToken);

        result = tokenService['createRefreshTokenForUserWithId'](userId);
      });

      afterAll(() => {
        jest.clearAllMocks();
      });

      it(`returns the JWT generated by '${JwtService.name}::${JwtService.prototype.sign.name}'`, () => {
        expect(result).toBe(refreshToken);
      });

      it(`calls '${JwtService.name}::${JwtService.prototype.sign.name}' with the appropriate payload & options`, () => {
        expect(jwtService.sign).toHaveBeenCalledTimes(1);
        expect(jwtService.sign).toHaveBeenCalledWith(
          { id: userId },
          {
            algorithm: authenticationModuleOptions.jwt.algorithm,
            issuer: authenticationModuleOptions.jwt.issuer,
            audience: authenticationModuleOptions.jwt.audience,
            subject: TokenService['REFRESH_TOKEN_JWT_SUBJECT'],
            secret: authenticationModuleOptions.jwt.secret,
            notBefore: 0,
            expiresIn:
              authenticationModuleOptions.refreshToken.expiresInSeconds,
          },
        );
      });
    },
  );

  describe(TokenService.prototype.validateRefreshToken.name, () => {
    describe('[on success', () => {
      const jwt = 'JWT to validate';
      const payload = { id: 'User-Id' };

      let result: string;

      beforeAll(() => {
        jwtService.verify.mockReturnValueOnce(payload);

        result = tokenService.validateRefreshToken(jwt);
      });

      afterAll(() => {
        jest.clearAllMocks();
      });

      it("returns the 'id' within the payload", () => {
        expect(result).toBe(payload.id);
      });

      it(`calls '${JwtService.name}::${JwtService.prototype.verify.name}' with the appropriate JWT & options`, () => {
        expect(jwtService.verify).toHaveBeenCalledTimes(1);
        expect(jwtService.verify).toHaveBeenCalledWith(jwt, {
          algorithms: [authenticationModuleOptions.jwt.algorithm],
          issuer: authenticationModuleOptions.jwt.issuer,
          audience: authenticationModuleOptions.jwt.audience,
          subject: TokenService['REFRESH_TOKEN_JWT_SUBJECT'],
          secret: authenticationModuleOptions.jwt.secret,
        });
      });
    });

    describe('[on failure]', () => {
      beforeAll(() => {
        jwtService.verify.mockImplementationOnce(() => {
          throw new Error();
        });
      });

      afterAll(() => {
        jest.clearAllMocks();
      });

      it(`throws an '${UnauthorizedException.name}' when '${JwtService.name}::${JwtService.prototype.verify.name}' fails`, () => {
        expect(() =>
          tokenService.validateRefreshToken('JWT to validate'),
        ).toThrow(UnauthorizedException);
      });
    });
  });
});
