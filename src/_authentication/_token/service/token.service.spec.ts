import { InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { ConfigurationService } from '@/_application/_configuration/service/configuration.service';
import { NamespacedConfiguration } from '@/_application/_configuration/type';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { newDocument } from '@/_library/helper';
import { User, UserSchema } from '@/_user/schema/user.schema';

import { Type } from '../constant';
import {
  JwtDurationConfigurationKey,
  JwtSecretConfigurationKey,
} from '../type';
import { TokenService } from './token.service';

jest.mock('@nestjs/jwt');
jest.mock('@/_application/_configuration/service/configuration.service');
jest.mock('@/_application/_logger/service/winston-logger.service');

describe(TokenService.name, () => {
  const generatedJwt = 'generated-jwt';
  const user = newDocument<User>(User, UserSchema, {
    email: 'user@email.com',
    password: 'P@ssw0rd',
  });

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

    jwtService.sign.mockReturnValue(generatedJwt);
    jwtService.verify.mockReturnValue({ id: user._id.toString() });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(tokenService).toBeDefined();
  });

  describe('getConfigurationForTokenType', () => {
    it('throws an `InternalServerErrorException` if the wrong token-type is provided', () => {
      expect(() =>
        tokenService['getConfigurationKeysForTokenType'](
          'wrong-token-type' as Type,
        ),
      ).toThrow(InternalServerErrorException);
    });

    it.each<{
      type: Type;
      expected: {
        jwtDurationConfigurationKey: keyof NamespacedConfiguration;
        jwtSecretConfigurationKey: keyof NamespacedConfiguration;
      };
    }>([
      {
        type: Type.USER_ACCESS_TOKEN,
        expected: {
          jwtDurationConfigurationKey:
            'user.authentication.jwt.accessToken.duration',
          jwtSecretConfigurationKey:
            'user.authentication.jwt.accessToken.secret',
        },
      },
      {
        type: Type.USER_REFRESH_TOKEN,
        expected: {
          jwtDurationConfigurationKey:
            'user.authentication.jwt.refreshToken.duration',
          jwtSecretConfigurationKey:
            'user.authentication.jwt.refreshToken.secret',
        },
      },
    ])(
      'it returns the correct configuration keys for: $type',
      ({
        type,
        expected: { jwtDurationConfigurationKey, jwtSecretConfigurationKey },
      }) => {
        expect(
          tokenService['getConfigurationKeysForTokenType'](type),
        ).toStrictEqual({
          jwtDurationConfigurationKey,
          jwtSecretConfigurationKey,
        });
      },
    );
  });

  describe('generateAuthenticationJwt', () => {
    describe.each<{
      type: Type;
      jwtDurationKey: JwtDurationConfigurationKey;
      jwtSecretKey: JwtSecretConfigurationKey;
    }>([
      {
        type: Type.USER_ACCESS_TOKEN,
        jwtDurationKey: 'user.authentication.jwt.accessToken.duration',
        jwtSecretKey: 'user.authentication.jwt.accessToken.secret',
      },
      {
        type: Type.USER_REFRESH_TOKEN,
        jwtDurationKey: 'user.authentication.jwt.refreshToken.duration',
        jwtSecretKey: 'user.authentication.jwt.refreshToken.secret',
      },
    ])(
      "- for token type: '$type'",
      ({ type, jwtDurationKey, jwtSecretKey }) => {
        it('calls `ConfigurationService::getOrThrow` with the appropriate arguments', () => {
          tokenService.generateAuthenticationJwt(type, user);

          expect(configurationService.getOrThrow).toHaveBeenCalledTimes(2);
          expect(configurationService.getOrThrow).toHaveBeenCalledWith(
            jwtDurationKey,
          );
          expect(configurationService.getOrThrow).toHaveBeenCalledWith(
            jwtSecretKey,
          );
        });

        it('calls `JwtService::sign` with the appropriate arguments [type: $type]', () => {
          tokenService.generateAuthenticationJwt(type, user);

          expect(jwtService.sign).toHaveBeenCalledTimes(1);
          expect(jwtService.sign).toHaveBeenCalledWith(
            { id: user._id.toString() },
            {
              algorithm: tokenService.JWT_ALGORITHM,
              issuer: tokenService.JWT_ISSUER,
              audience: tokenService.JWT_AUDIENCE,
              secret: configurationService.getOrThrow(jwtSecretKey),
              notBefore: 0,
              expiresIn: Math.floor(
                configurationService.getOrThrow(jwtDurationKey) / 1000,
              ),
            },
          );
        });

        it('logs the appropriate data', () => {
          tokenService.generateAuthenticationJwt(type, user);

          expect(loggerService.log).toHaveBeenCalledTimes(1);
          expect(loggerService.log).toHaveBeenCalledWith('JWT generated', {
            type,
            user,
          });
        });

        it('returns the token and its expiry date', () => {
          const { token, expiresAt } = tokenService.generateAuthenticationJwt(
            type,
            user,
          );

          expect(token).toBe(generatedJwt);
          expect(Math.floor(expiresAt / 1000)).toBe(
            Math.floor(
              (Date.now() + configurationService.getOrThrow(jwtDurationKey)) /
                1000,
            ),
          );
        });
      },
    );
  });

  describe('validateAuthenticationJwt', () => {
    describe.each<{ type: Type; jwtSecretKey: JwtSecretConfigurationKey }>([
      {
        type: Type.USER_ACCESS_TOKEN,
        jwtSecretKey: 'user.authentication.jwt.accessToken.secret',
      },
      {
        type: Type.USER_REFRESH_TOKEN,
        jwtSecretKey: 'user.authentication.jwt.refreshToken.secret',
      },
    ])('- for token type: $type', ({ type, jwtSecretKey }) => {
      it('gets queries the proper jwt secret [type: $type]', () => {
        tokenService.validateAuthenticationJwt(type, '- jwt -');

        expect(configurationService.getOrThrow).toBeCalledTimes(1);
        expect(configurationService.getOrThrow).toHaveBeenCalledWith(
          jwtSecretKey,
        );
      });

      it('logs data about the validated authentication JWT', () => {
        tokenService.validateAuthenticationJwt(type, '- jwt -');

        expect(loggerService.log).toHaveBeenCalledTimes(1);
        expect(loggerService.log).toHaveBeenCalledWith(
          'Validated authentication JWT',
          { type, payload: { id: user._id.toString() } },
        );
      });

      it('returns the id within the payload', () => {
        expect(
          tokenService.validateAuthenticationJwt(type, '- jwt -'),
        ).toStrictEqual({
          id: user._id.toString(),
        });
      });
    });
  });
});
