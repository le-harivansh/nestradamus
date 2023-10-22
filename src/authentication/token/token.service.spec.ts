import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from 'mongodb';
import ms from 'ms';

import { RequestUser } from '../../user/schema/user.schema';
import { JwtType } from '../helpers';
import { TokenService } from './token.service';

describe(TokenService.name, () => {
  const user: RequestUser = {
    id: new ObjectId().toString(),
    username: 'OneTwo',
  };

  const jsonWebToken = 'GENERATED-TOKEN';
  const jwtService = {
    sign: jest.fn(() => jsonWebToken),
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
    const payload = { userId: user.id };
    const tokenType = JwtType.ACCESS_TOKEN;
    const durationSeconds = 60;
    const secret = configuration['authentication.jwt.accessToken.secret'];

    let token: string;

    beforeEach(() => {
      token = tokenService['generateJsonWebToken'](payload, {
        type: tokenType,
        durationSeconds,
        secret,
      });
    });

    it('calls the resolved `JwtService` with the correct arguments', async () => {
      const applicationName = configuration['application.name'].toLowerCase();

      expect(jwtService.sign).toHaveBeenCalledTimes(1);

      expect((jwtService.sign.mock.calls[0] as unknown[])[0]).toStrictEqual(
        payload,
      );
      expect((jwtService.sign.mock.calls[0] as unknown[])[1]).toStrictEqual({
        algorithm: 'ES512',
        expiresIn: durationSeconds,
        notBefore: 0,
        audience: applicationName,
        issuer: applicationName,
        subject: tokenType,
        secret: configuration['authentication.jwt.accessToken.secret'],
      });
    });

    it('returns the generated token', () => {
      expect(token).toBe(jsonWebToken);
    });
  });

  describe('generateAccessTokenFor', () => {
    const tokenType = JwtType.ACCESS_TOKEN;
    const duration = ms(
      configuration['authentication.jwt.accessToken.duration'],
    );
    const secret = configuration['authentication.jwt.accessToken.secret'];

    let tokenWithExpiry: object;

    beforeEach(() => {
      tokenWithExpiry = tokenService.generateAccessTokenFor(user);
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

    it('returns the access-token with its expiry timestamp', () => {
      expect(tokenWithExpiry).toStrictEqual({
        token: jsonWebToken,
        expiresAt: Date.now() + duration,
      });
    });
  });

  describe('generateRefreshTokenFor', () => {
    const tokenType = JwtType.REFRESH_TOKEN;
    const duration = ms(
      configuration['authentication.jwt.refreshToken.duration'],
    );
    const secret = configuration['authentication.jwt.refreshToken.secret'];

    let tokenWithExpiry: object;

    beforeEach(() => {
      tokenWithExpiry = tokenService.generateRefreshTokenFor(user);
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

    it('returns the refresh-token with its expiry timestamp', () => {
      expect(tokenWithExpiry).toStrictEqual({
        token: jsonWebToken,
        expiresAt: Date.now() + duration,
      });
    });
  });
});
