import { InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { ConfigurationService } from '@/_application/_configuration/service/configuration.service';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { JwtType } from '@/_authentication/constant';
import { newDocument } from '@/_library/helper';
import { User, UserSchema } from '@/_user/schema/user.schema';

import { TokenService } from './token.service';

jest.mock('@nestjs/jwt');
jest.mock('@/_application/_configuration/service/configuration.service');
jest.mock('@/_application/_logger/service/winston-logger.service');

describe(TokenService.name, () => {
  const generatedJsonWebToken = 'GENERATED-TOKEN';

  let configurationService: jest.Mocked<ConfigurationService>;
  let loggerService: jest.Mocked<WinstonLoggerService>;
  let jwtService: jest.Mocked<JwtService>;
  let tokenService: TokenService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigurationService,
        WinstonLoggerService,
        JwtService,
        TokenService,
      ],
    }).compile();

    configurationService = module.get(ConfigurationService);
    loggerService = module.get(WinstonLoggerService);
    jwtService = module.get(JwtService);
    tokenService = module.get(TokenService);

    jwtService.sign.mockReturnValue(generatedJsonWebToken);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateJsonWebToken', () => {
    const payload = { userId: new Types.ObjectId().toString() };
    const tokenOptions = {
      type: JwtType.ACCESS_TOKEN,
      durationSeconds: 15 * 60,
      secret: 'JWT_SECRET',
    };

    let generatedToken: string = '';

    beforeEach(() => {
      generatedToken = tokenService['generateJsonWebToken'](
        payload,
        tokenOptions,
      );
    });

    it('calls `TokenService::generateJsonWebToken` with the appropriate arguments', () => {
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(payload, {
        algorithm: tokenService.JWT_ALGORITHM,
        expiresIn: tokenOptions.durationSeconds,
        notBefore: 0,
        audience: tokenService.JWT_AUDIENCE,
        issuer: tokenService.JWT_ISSUER,
        subject: tokenOptions.type,
        secret: tokenOptions.secret,
      });
    });

    it('returns the generated token', () => {
      expect(generatedToken).toBe(generatedJsonWebToken);
    });
  });

  describe('getSecret', () => {
    it('returns the secret of `access-tokens`', () => {
      expect(tokenService.getSecret(JwtType.ACCESS_TOKEN)).toBe(
        configurationService.getOrThrow(
          'authentication.jwt.accessToken.secret',
        ),
      );
    });

    it('returns the secret of `refresh-tokens`', () => {
      expect(tokenService.getSecret(JwtType.REFRESH_TOKEN)).toBe(
        configurationService.getOrThrow(
          'authentication.jwt.refreshToken.secret',
        ),
      );
    });

    it('throws an error if an invalid `tokenType` is provided', () => {
      expect(() =>
        tokenService.getSecret('invalid-token' as unknown as JwtType),
      ).toThrow(InternalServerErrorException);
    });
  });

  describe.each<{
    tokenType: JwtType;
    serviceMethod: Extract<
      keyof TokenService,
      'generateAccessTokenFor' | 'generateRefreshTokenFor'
    >;
    configurationDiscriminationKey: 'accessToken' | 'refreshToken';
  }>([
    {
      tokenType: JwtType.ACCESS_TOKEN,
      serviceMethod: 'generateAccessTokenFor',
      configurationDiscriminationKey: 'accessToken',
    },
    {
      tokenType: JwtType.REFRESH_TOKEN,
      serviceMethod: 'generateRefreshTokenFor',
      configurationDiscriminationKey: 'refreshToken',
    },
  ])(
    '$serviceMethod',
    ({ tokenType, serviceMethod, configurationDiscriminationKey }) => {
      const user = newDocument<User>(User, UserSchema, {
        email: 'user@email.com',
        password: 'P@ssw0rd',
      });

      let duration: number;
      let secret: string;
      let tokenWithExpiry: { token: string; expiresAt: number };

      beforeAll(() => {
        duration = configurationService.getOrThrow(
          `authentication.jwt.${configurationDiscriminationKey}.duration`,
        );

        secret = configurationService.getOrThrow(
          `authentication.jwt.${configurationDiscriminationKey}.secret`,
        );
      });

      beforeEach(() => {
        tokenWithExpiry = tokenService[serviceMethod](user);
      });

      it('calls the JWT service with the correct payload & options', () => {
        expect(jwtService.sign.mock.calls[0]![0]).toStrictEqual({
          userId: user._id.toString(),
        });

        expect(jwtService.sign.mock.calls[0]![1]).toMatchObject({
          expiresIn: Math.floor(duration / 1000),
          subject: tokenType,
          secret,
        });
      });

      it('returns the token with its expiry timestamp', () => {
        expect(tokenWithExpiry.token).toBe(generatedJsonWebToken);
        expect(tokenWithExpiry.expiresAt / 10_000).toBeCloseTo(
          (Date.now() + duration) / 10_000,
          1,
        );
      });

      it('logs the data about the user requesting the token', () => {
        expect(loggerService.log).toHaveBeenCalledTimes(1);
        expect(loggerService.log).toHaveBeenCalledWith(
          expect.stringMatching(/Generated (access|refresh)-token/),
          user,
        );
      });
    },
  );
});
