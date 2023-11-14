import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import ms from 'ms';

import { ConfigurationService } from '@/_application/_configuration/service/configuration.service';
import { JwtType } from '@/_authentication/helper';
import { RequestUser } from '@/_user/schema/user.schema';

@Injectable()
export class TokenService {
  public readonly JWT_ALGORITHM: JwtSignOptions['algorithm'] = 'HS512';
  public readonly JWT_ISSUER: string;
  public readonly JWT_AUDIENCE: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configurationService: ConfigurationService,
  ) {
    this.JWT_ISSUER = this.configurationService
      .getOrThrow('application.name')
      .toLowerCase();

    this.JWT_AUDIENCE = this.JWT_ISSUER;
  }

  public generateAccessTokenFor({ id: userId }: RequestUser): {
    token: string;
    expiresAt: number;
  } {
    const duration = ms(
      this.configurationService.getOrThrow(
        'authentication.jwt.accessToken.duration',
      ),
    );

    const token = this.generateJsonWebToken(
      { userId },
      {
        type: JwtType.ACCESS_TOKEN,
        durationSeconds: Math.floor(duration / 1000),
        secret: this.getSecret(JwtType.ACCESS_TOKEN),
      },
    );

    return {
      token,
      expiresAt: Date.now() + duration,
    };
  }

  public generateRefreshTokenFor({ id: userId }: RequestUser): {
    token: string;
    expiresAt: number;
  } {
    const duration = ms(
      this.configurationService.getOrThrow(
        'authentication.jwt.refreshToken.duration',
      ),
    );

    const token = this.generateJsonWebToken(
      { userId },
      {
        type: JwtType.REFRESH_TOKEN,
        durationSeconds: Math.floor(duration / 1000),
        secret: this.getSecret(JwtType.REFRESH_TOKEN),
      },
    );

    return {
      token,
      expiresAt: Date.now() + duration,
    };
  }

  public getSecret(tokenType: JwtType): string {
    switch (tokenType) {
      case JwtType.ACCESS_TOKEN:
        return this.configurationService.getOrThrow(
          'authentication.jwt.accessToken.secret',
        );

      case JwtType.REFRESH_TOKEN:
        return this.configurationService.getOrThrow(
          'authentication.jwt.refreshToken.secret',
        );

      default:
        throw new InternalServerErrorException(
          `Invalid token-type: ${tokenType} specified.`,
        );
    }
  }

  /**
   * Generates a JWT.
   *
   * @param payload The payload of the JWT.
   * @param tokenConfiguration An object containing the token's:
   *  * `type`,
   *  * `durationSeconds` (duration in seconds),
   *  * `secret`
   * @returns The Json Web Token string.
   */
  private generateJsonWebToken(
    payload: object,
    {
      type,
      durationSeconds,
      secret,
    }: { type: JwtType; durationSeconds: number; secret: string },
  ): string {
    return this.jwtService.sign(payload, {
      algorithm: this.JWT_ALGORITHM,
      expiresIn: durationSeconds,
      notBefore: 0,
      audience: this.JWT_AUDIENCE,
      issuer: this.JWT_ISSUER,
      subject: type,
      secret: secret,
    });
  }
}
