import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CookieOptions } from 'express';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { AccessTokenCallbackService } from './access-token-callback.service';
import { RefreshTokenCallbackService } from './refresh-token-callback.service';

@Injectable()
export class TokenService {
  static readonly COOKIE_OPTIONS: Readonly<CookieOptions> = {
    secure: true,
    httpOnly: true,
    signed: true,
    sameSite: 'lax',
  } as const;

  private static readonly ACCESS_TOKEN_JWT_SUBJECT = 'access-token';
  private static readonly REFRESH_TOKEN_JWT_SUBJECT = 'refresh-token';

  constructor(
    @Inject(AUTHENTICATION_MODULE_OPTIONS_TOKEN)
    private readonly authenticationModuleOptions: AuthenticationModuleOptions,

    private readonly jwtService: JwtService,

    private readonly accessTokenCallbackService: AccessTokenCallbackService,
    private readonly refreshTokenCallbackService: RefreshTokenCallbackService,
  ) {}

  async createAccessToken(user: unknown): Promise<string> {
    return this.jwtService.sign(
      await this.accessTokenCallbackService.createJwtPayload(user),
      {
        algorithm: this.authenticationModuleOptions.jwt.algorithm,
        issuer: this.authenticationModuleOptions.jwt.issuer,
        audience: this.authenticationModuleOptions.jwt.audience,
        subject: TokenService.ACCESS_TOKEN_JWT_SUBJECT,
        secret: this.authenticationModuleOptions.jwt.secret,
        notBefore: 0,
        expiresIn:
          this.authenticationModuleOptions.cookie.accessToken.expiresInSeconds,
      },
    );
  }

  async validateAccessToken(jwt: string): Promise<Record<string, unknown>> {
    try {
      const payload = this.jwtService.verify<Record<string, unknown>>(jwt, {
        algorithms: [this.authenticationModuleOptions.jwt.algorithm],
        issuer: this.authenticationModuleOptions.jwt.issuer,
        audience: this.authenticationModuleOptions.jwt.audience,
        subject: TokenService.ACCESS_TOKEN_JWT_SUBJECT,
        secret: this.authenticationModuleOptions.jwt.secret,
      });

      if (
        !(await this.accessTokenCallbackService.validateJwtPayload(payload))
      ) {
        throw new Error();
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid access-token.');
    }
  }

  async createRefreshToken(user: unknown): Promise<string> {
    return this.jwtService.sign(
      await this.refreshTokenCallbackService.createJwtPayload(user),
      {
        algorithm: this.authenticationModuleOptions.jwt.algorithm,
        issuer: this.authenticationModuleOptions.jwt.issuer,
        audience: this.authenticationModuleOptions.jwt.audience,
        subject: TokenService.REFRESH_TOKEN_JWT_SUBJECT,
        secret: this.authenticationModuleOptions.jwt.secret,
        notBefore: 0,
        expiresIn:
          this.authenticationModuleOptions.cookie.refreshToken.expiresInSeconds,
      },
    );
  }

  async validateRefreshToken(jwt: string): Promise<Record<string, unknown>> {
    try {
      const payload = this.jwtService.verify<Record<string, unknown>>(jwt, {
        algorithms: [this.authenticationModuleOptions.jwt.algorithm],
        issuer: this.authenticationModuleOptions.jwt.issuer,
        audience: this.authenticationModuleOptions.jwt.audience,
        subject: TokenService.REFRESH_TOKEN_JWT_SUBJECT,
        secret: this.authenticationModuleOptions.jwt.secret,
      });
      if (
        !(await this.refreshTokenCallbackService.validateJwtPayload(payload))
      ) {
        throw new UnauthorizedException();
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh-token.');
    }
  }
}
