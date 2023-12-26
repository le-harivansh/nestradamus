import { InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { ConfigurationService } from '@/_application/_configuration/service/configuration.service';
import { NamespacedConfiguration } from '@/_application/_configuration/type';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { JwtType } from '@/_library/authentication/type';
import { AuthenticationJwtPayload } from '@/_library/authentication/type';
import { newDocument } from '@/_library/test.helper';
import { User, UserSchema } from '@/_user/_user/schema/user.schema';

import { TokenService } from './token.service';

jest.mock('@nestjs/jwt');
jest.mock('@/_application/_configuration/service/configuration.service');
jest.mock('@/_application/_logger/service/winston-logger.service');

describe(TokenService.name, () => {
  const generatedJwt = 'generated-jwt';
  const user = newDocument<User>(User, UserSchema, {
    username: 'user@email.com',
    password: 'P@ssw0rd',
  });

  let jwtService: jest.Mocked<JwtService>;
  let configurationService: jest.Mocked<ConfigurationService>;
  let tokenService: TokenService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtService,
        WinstonLoggerService,
        ConfigurationService,
        TokenService,
      ],
    }).compile();

    jwtService = module.get(JwtService);
    configurationService = module.get(ConfigurationService);
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

  describe('getConfigurationValuesForTokenOfType', () => {
    describe.each<{ type: JwtType; configurationKeyDiscriminator: string }>([
      { type: 'access-token', configurationKeyDiscriminator: 'accessToken' },
      { type: 'refresh-token', configurationKeyDiscriminator: 'refreshToken' },
    ])('- type: $type', ({ type, configurationKeyDiscriminator }) => {
      let result: { durationMs: number; secret: string };

      beforeEach(() => {
        result = tokenService['getConfigurationValuesForTokenOfType'](type);
      });

      it('calls `ConfigurationService::getOrThrow` with the correct configuration keys', () => {
        expect(configurationService.getOrThrow).toHaveBeenCalledTimes(2);
        expect(configurationService.getOrThrow).toHaveBeenCalledWith(
          `user.authentication.jwt.${configurationKeyDiscriminator}.duration`,
        );
        expect(configurationService.getOrThrow).toHaveBeenCalledWith(
          `user.authentication.jwt.${configurationKeyDiscriminator}.secret`,
        );
      });

      it('returns the configured JWT duration & secret', () => {
        expect(result).toStrictEqual({
          durationMs: configurationService.getOrThrow(
            `user.authentication.jwt.${configurationKeyDiscriminator}.duration` as keyof NamespacedConfiguration,
          ),
          secret: configurationService.getOrThrow(
            `user.authentication.jwt.${configurationKeyDiscriminator}.secret` as keyof NamespacedConfiguration,
          ),
        });
      });
    });

    it('throws an `InternalServerErrorException` if an invalid JWT type is provided', () => {
      expect(() =>
        tokenService['getConfigurationValuesForTokenOfType'](
          'invalid-token-type' as JwtType,
        ),
      ).toThrow(InternalServerErrorException);
    });
  });

  describe('generateAuthenticationJwt', () => {
    const jwtConfiguration = {
      durationMs: 15 * 60 * 1000,
      secret: 'jwt-secret',
    };
    const jwtTokenData = {
      token: 'json-web-token',
      expiresAt: Date.now() + jwtConfiguration.durationMs,
    };

    beforeAll(() => {
      jest
        .spyOn(tokenService as any, 'getConfigurationValuesForTokenOfType')
        .mockReturnValue(jwtConfiguration);

      jest
        .spyOn(tokenService as any, 'generateJwt')
        .mockReturnValue(jwtTokenData);
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    const user = newDocument<User>(User, UserSchema, {
      username: 'user@email.com',
      password: 'P@ssw0rd',
    });

    describe.each<{ type: JwtType }>([
      { type: 'access-token' },
      { type: 'refresh-token' },
    ])('- type: $type', ({ type }) => {
      let result: { token: string; expiresAt: number };

      beforeEach(() => {
        result = tokenService.generateAuthenticationJwt(type, user);
      });

      it('calls `TokenService::getConfigurationValuesForTokenOfType` with the passed-in JWT token type', () => {
        expect(
          tokenService['getConfigurationValuesForTokenOfType'],
        ).toHaveBeenCalledTimes(1);
        expect(
          tokenService['getConfigurationValuesForTokenOfType'],
        ).toHaveBeenCalledWith(type);
      });

      it('calls `TokenService::generateJwt` with the appropriate arguments', () => {
        expect(tokenService['generateJwt']).toHaveBeenCalledTimes(1);
        expect(tokenService['generateJwt']).toHaveBeenCalledWith(
          { id: user._id.toString() },
          {
            durationMs: jwtConfiguration.durationMs,
            secret: jwtConfiguration.secret,
          },
        );
      });

      it('returns the jwt-data returned from `TokenService::generateJwt`', () => {
        expect(result).toBe(jwtTokenData);
      });
    });
  });

  describe('validateAuthenticationJwt', () => {
    const jwtConfiguration = {
      secret: 'jwt-secret',
    };
    const jwt = 'json-web-token';
    const decryptedJwt = {
      id: new Types.ObjectId().toString(),
    };

    beforeAll(() => {
      jest
        .spyOn(tokenService as any, 'getConfigurationValuesForTokenOfType')
        .mockReturnValue(jwtConfiguration);

      jest
        .spyOn(tokenService as any, 'validateJwt')
        .mockReturnValue(decryptedJwt);
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    describe.each<{ type: JwtType }>([
      { type: 'access-token' },
      { type: 'refresh-token' },
    ])('- type: $type', ({ type }) => {
      let result: AuthenticationJwtPayload;

      beforeEach(() => {
        result = tokenService.validateAuthenticationJwt(type, jwt);
      });

      it('calls `TokenService::getConfigurationValuesForTokenOfType` with the passed-in JWT token type', () => {
        expect(
          tokenService['getConfigurationValuesForTokenOfType'],
        ).toHaveBeenCalledTimes(1);
        expect(
          tokenService['getConfigurationValuesForTokenOfType'],
        ).toHaveBeenCalledWith(type);
      });

      it('calls `TokenService::validateJwt` with the appropriate arguments', () => {
        expect(tokenService['validateJwt']).toHaveBeenCalledTimes(1);
        expect(tokenService['validateJwt']).toHaveBeenCalledWith(
          jwt,
          jwtConfiguration.secret,
        );
      });

      it('returns the jwt-data returned from `TokenService::generateJwt`', () => {
        expect(result).toStrictEqual({
          id: decryptedJwt.id,
        });
      });
    });
  });
});
