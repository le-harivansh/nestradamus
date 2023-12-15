import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

import { ConfigurationService } from '@/_application/_configuration/service/configuration.service';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { UserDocument } from '@/_user/_user/schema/user.schema';

import { Type } from '../constant';
import {
  AuthenticationJwtPayload,
  JwtDurationConfigurationKey,
  JwtSecretConfigurationKey,
} from '../type';

@Injectable()
export class TokenService {
  public readonly JWT_ALGORITHM: Exclude<
    JwtSignOptions['algorithm'],
    undefined
  > = 'HS512';
  public readonly JWT_ISSUER: string;
  public readonly JWT_AUDIENCE: string;

  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly loggerService: WinstonLoggerService,
    private readonly jwtService: JwtService,
  ) {
    this.loggerService.setContext(TokenService.name);

    this.JWT_AUDIENCE = this.JWT_ISSUER = this.configurationService
      .getOrThrow('application.name')
      .toLowerCase();
  }

  public generateAuthenticationJwt(
    type: Type,
    user: UserDocument,
  ): { token: string; expiresAt: number } {
    const { jwtDurationConfigurationKey, jwtSecretConfigurationKey } =
      this.getConfigurationKeysForTokenType(type);
    const payload: AuthenticationJwtPayload = { id: user._id.toString() };

    const durationSeconds = Math.floor(
      this.configurationService.getOrThrow(jwtDurationConfigurationKey) / 1000,
    );
    const secret = this.configurationService.getOrThrow(
      jwtSecretConfigurationKey,
    );

    const token = this.jwtService.sign(payload, {
      algorithm: this.JWT_ALGORITHM,
      issuer: this.JWT_ISSUER,
      audience: this.JWT_AUDIENCE,
      secret: secret,
      notBefore: 0,
      expiresIn: durationSeconds,
    });

    this.loggerService.log('JWT generated', { type, user });

    const expiresAt = Date.now() + durationSeconds * 1000;

    return { token, expiresAt };
  }

  public validateAuthenticationJwt(
    type: Type,
    jwt: string,
  ): AuthenticationJwtPayload {
    const { jwtSecretConfigurationKey } =
      this.getConfigurationKeysForTokenType(type);

    const payload = this.jwtService.verify<
      AuthenticationJwtPayload & { [key: string]: unknown }
    >(jwt, {
      algorithms: [this.JWT_ALGORITHM],
      issuer: this.JWT_ISSUER,
      audience: this.JWT_AUDIENCE,
      secret: this.configurationService.getOrThrow(jwtSecretConfigurationKey),
    });

    this.loggerService.log('Validated authentication JWT', {
      type,
      payload,
    });

    return { id: payload.id };
  }

  private getConfigurationKeysForTokenType(type: Type): {
    jwtDurationConfigurationKey: JwtDurationConfigurationKey;
    jwtSecretConfigurationKey: JwtSecretConfigurationKey;
  } {
    let jwtDurationConfigurationKey: JwtDurationConfigurationKey;
    let jwtSecretConfigurationKey: JwtSecretConfigurationKey;

    switch (type) {
      case Type.USER_ACCESS_TOKEN:
        jwtDurationConfigurationKey =
          'user.authentication.jwt.accessToken.duration';
        jwtSecretConfigurationKey =
          'user.authentication.jwt.accessToken.secret';
        break;

      case Type.USER_REFRESH_TOKEN:
        jwtDurationConfigurationKey =
          'user.authentication.jwt.refreshToken.duration';
        jwtSecretConfigurationKey =
          'user.authentication.jwt.refreshToken.secret';
        break;

      default:
        throw new InternalServerErrorException(
          `Invalid JWT type '${type}' provided.`,
        );
    }

    return {
      jwtDurationConfigurationKey,
      jwtSecretConfigurationKey,
    };
  }
}
