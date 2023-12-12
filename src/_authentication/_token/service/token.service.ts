import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

import { ConfigurationService } from '@/_application/_configuration/service/configuration.service';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { JwtType } from '@/_authentication/constant';
import { UserDocument } from '@/_user/schema/user.schema';

@Injectable()
export class TokenService {
  public readonly JWT_ALGORITHM: JwtSignOptions['algorithm'] = 'HS512';
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

  public generateAccessTokenFor(user: UserDocument): {
    token: string;
    expiresAt: number;
  } {
    const duration = this.configurationService.getOrThrow(
      'authentication.jwt.accessToken.duration',
    );
    const token = this.generateJsonWebToken(
      { userId: user._id.toString() },
      {
        type: JwtType.ACCESS_TOKEN,
        durationSeconds: Math.floor(duration / 1000),
        secret: this.getSecret(JwtType.ACCESS_TOKEN),
      },
    );

    this.loggerService.log('Generated access-token', user);

    return {
      token,
      expiresAt: Date.now() + duration,
    };
  }

  public generateRefreshTokenFor(user: UserDocument): {
    token: string;
    expiresAt: number;
  } {
    const duration = this.configurationService.getOrThrow(
      'authentication.jwt.refreshToken.duration',
    );
    const token = this.generateJsonWebToken(
      { userId: user._id.toString() },
      {
        type: JwtType.REFRESH_TOKEN,
        durationSeconds: Math.floor(duration / 1000),
        secret: this.getSecret(JwtType.REFRESH_TOKEN),
      },
    );

    this.loggerService.log('Generated refresh-token', user);

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
