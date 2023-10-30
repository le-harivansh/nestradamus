import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import ms from 'ms';

import { RequestUser } from '../../../_user/schema/user.schema';
import { JwtType } from '../../helpers';
import { TokenService } from './token.service';

describe(TokenService.name, () => {
  const user: RequestUser = {
    id: new Types.ObjectId().toString(),
    username: 'OneTwo',
  };

  const generatedJsonWebToken = 'GENERATED-TOKEN';
  const jwtService = {
    sign: jest.fn(() => generatedJsonWebToken),
  };

  const configuration = {
    'application.name': 'Super-App',

    'authentication.jwt.accessToken.secret': 'access-token-secret',
    'authentication.jwt.accessToken.duration': '15 minutes',

    'authentication.jwt.refreshToken.secret': 'refresh-token-secret',
    'authentication.jwt.refreshToken.duration': '1 week',
  };
  const configService = {
    getOrThrow: jest.fn(
      (key: keyof typeof configuration) => configuration[key],
    ),
  };

  let tokenService: TokenService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        TokenService,
      ],
    }).compile();

    tokenService = module.get(TokenService);
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

    it('calls TokenService::generateJsonWebToken with the appropriate arguments', () => {
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
        configuration['authentication.jwt.accessToken.secret'],
      );
    });

    it('returns the secret of `refresh-tokens`', () => {
      expect(tokenService.getSecret(JwtType.REFRESH_TOKEN)).toBe(
        configuration['authentication.jwt.refreshToken.secret'],
      );
    });

    it('throws an error if an invalid `tokenType` is provided', () => {
      expect(() =>
        tokenService.getSecret('invalid-token' as unknown as JwtType),
      ).toThrow(InternalServerErrorException);
    });
  });

  describe.each([
    {
      tokenType: JwtType.ACCESS_TOKEN,
      serviceMethod: 'generateAccessTokenFor',
      configurationDiscriminationKey: 'accessToken',
    } as const,
    {
      tokenType: JwtType.REFRESH_TOKEN,
      serviceMethod: 'generateRefreshTokenFor',
      configurationDiscriminationKey: 'refreshToken',
    } as const,
  ])(
    '$serviceMethod',
    ({ tokenType, serviceMethod, configurationDiscriminationKey }) => {
      const duration = ms(
        configuration[
          `authentication.jwt.${configurationDiscriminationKey}.duration`
        ],
      );
      const secret =
        configuration[
          `authentication.jwt.${configurationDiscriminationKey}.secret`
        ];

      let tokenWithExpiry: { token: string; expiresAt: number };

      beforeEach(() => {
        tokenWithExpiry = tokenService[serviceMethod](user);
      });

      it('calls the JWT service with the correct payload & options', () => {
        expect((jwtService.sign.mock.calls[0] as unknown[])[0]).toStrictEqual({
          userId: user.id,
        });

        expect((jwtService.sign.mock.calls[0] as unknown[])[1]).toMatchObject({
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
    },
  );
});
