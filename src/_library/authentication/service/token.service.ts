import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { HydratedDocument } from 'mongoose';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';

import { Authenticatable } from '../schema/authenticatable.interface';
import { JwtType } from '../type';
import { AuthenticationJwtPayload } from '../type';

export abstract class TokenService<T extends Authenticatable> {
  static readonly JWT_ALGORITHM: NonNullable<JwtSignOptions['algorithm']> =
    'HS512';

  constructor(
    private readonly jwtService: JwtService,
    private readonly jwtOptions: Readonly<
      Required<Pick<JwtSignOptions, 'issuer' | 'audience'>>
    >,
    private readonly loggerService: WinstonLoggerService,
  ) {}

  abstract generateAuthenticationJwt(
    type: JwtType,
    authenticatableEntity: HydratedDocument<T>,
  ): { token: string; expiresAt: number };

  abstract validateAuthenticationJwt(
    type: JwtType,
    jwt: string,
  ): AuthenticationJwtPayload;

  protected generateJwt(
    payload: object,
    { durationMs, secret }: { durationMs: number; secret: string },
  ): { token: string; expiresAt: number } {
    const durationSeconds = Math.floor(durationMs / 1000);

    const token = this.jwtService.sign(payload, {
      algorithm: TokenService.JWT_ALGORITHM,
      ...this.jwtOptions,
      secret: secret,
      notBefore: 0,
      expiresIn: durationSeconds,
    });

    this.loggerService.log('JWT generated', { payload });

    const expiresAt = Date.now() + durationSeconds * 1000;

    return { token, expiresAt };
  }

  protected validateJwt(jwt: string, secret: string): unknown {
    const decryptedJwt: unknown = this.jwtService.verify(jwt, {
      algorithms: [TokenService.JWT_ALGORITHM],
      issuer: this.jwtOptions.issuer,
      audience: this.jwtOptions.audience,
      secret,
    });

    this.loggerService.log('Validated JWT', {
      jwt,
      decryptedJwt,
    });

    return decryptedJwt;
  }
}
