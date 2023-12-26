import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HydratedDocument } from 'mongoose';

import { Administrator } from '@/_administration/_administrator/schema/administrator.schema';
import { ConfigurationService } from '@/_application/_configuration/service/configuration.service';
import { NamespacedConfiguration } from '@/_application/_configuration/type';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { TokenService as AbstractTokenService } from '@/_library/authentication/service/token.service';
import { JwtType } from '@/_library/authentication/type';
import { AuthenticationJwtPayload } from '@/_library/authentication/type';

@Injectable()
export class TokenService extends AbstractTokenService<Administrator> {
  constructor(
    jwtService: JwtService,
    loggerService: WinstonLoggerService,
    private readonly configurationService: ConfigurationService,
  ) {
    loggerService.setContext(`${TokenService.name}[${Administrator.name}]`);

    const applicationName = configurationService.getOrThrow('application.name');

    super(
      jwtService,
      {
        issuer: applicationName,
        audience: applicationName,
      },
      loggerService,
    );
  }

  override generateAuthenticationJwt(
    type: JwtType,
    authenticatableEntity: HydratedDocument<Administrator>,
  ): { token: string; expiresAt: number } {
    const { durationMs, secret } =
      this.getConfigurationValuesForTokenOfType(type);

    return this.generateJwt(
      { id: authenticatableEntity._id.toString() },
      {
        durationMs,
        secret,
      },
    );
  }

  override validateAuthenticationJwt(
    type: JwtType,
    jwt: string,
  ): AuthenticationJwtPayload {
    const { secret } = this.getConfigurationValuesForTokenOfType(type);

    const decryptedJwt = this.validateJwt(
      jwt,
      secret,
    ) as AuthenticationJwtPayload & { [key: string]: unknown };

    return {
      id: decryptedJwt.id,
    };
  }

  private getConfigurationValuesForTokenOfType(type: JwtType): {
    durationMs: number;
    secret: string;
  } {
    let jwtDurationConfigurationKey: Extract<
      keyof NamespacedConfiguration,
      | 'administrator.authentication.jwt.accessToken.duration'
      | 'administrator.authentication.jwt.refreshToken.duration'
    >;
    let jwtSecretConfigurationKey: Extract<
      keyof NamespacedConfiguration,
      | 'administrator.authentication.jwt.accessToken.secret'
      | 'administrator.authentication.jwt.refreshToken.secret'
    >;

    switch (type) {
      case 'access-token':
        jwtDurationConfigurationKey =
          'administrator.authentication.jwt.accessToken.duration';
        jwtSecretConfigurationKey =
          'administrator.authentication.jwt.accessToken.secret';
        break;

      case 'refresh-token':
        jwtDurationConfigurationKey =
          'administrator.authentication.jwt.refreshToken.duration';
        jwtSecretConfigurationKey =
          'administrator.authentication.jwt.refreshToken.secret';
        break;

      default:
        throw new InternalServerErrorException(
          `Invalid type: '${type}' provided.`,
        );
    }

    return {
      durationMs: this.configurationService.getOrThrow(
        jwtDurationConfigurationKey,
      ),
      secret: this.configurationService.getOrThrow(jwtSecretConfigurationKey),
    };
  }
}
