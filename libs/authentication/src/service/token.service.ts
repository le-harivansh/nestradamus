import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CookieOptions } from 'express';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';

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
  ) {}

  createAccessTokenForUserWithId(id: string): string {
    return this.jwtService.sign(
      { id },
      {
        algorithm: this.authenticationModuleOptions.jwt.algorithm,
        issuer: this.authenticationModuleOptions.jwt.issuer,
        audience: this.authenticationModuleOptions.jwt.audience,
        subject: TokenService.ACCESS_TOKEN_JWT_SUBJECT,
        secret: this.authenticationModuleOptions.jwt.secret,
        notBefore: 0,
        expiresIn:
          this.authenticationModuleOptions.accessToken.expiresInSeconds,
      },
    );
  }

  validateAccessToken(jwt: string): string {
    try {
      return this.jwtService.verify<{ id: string }>(jwt, {
        algorithms: [this.authenticationModuleOptions.jwt.algorithm],
        issuer: this.authenticationModuleOptions.jwt.issuer,
        audience: this.authenticationModuleOptions.jwt.audience,
        subject: TokenService.ACCESS_TOKEN_JWT_SUBJECT,
        secret: this.authenticationModuleOptions.jwt.secret,
      }).id;
    } catch {
      throw new UnauthorizedException('Invalid access-token.');
    }
  }

  createRefreshTokenForUserWithId(id: string): string {
    return this.jwtService.sign(
      { id },
      {
        algorithm: this.authenticationModuleOptions.jwt.algorithm,
        issuer: this.authenticationModuleOptions.jwt.issuer,
        audience: this.authenticationModuleOptions.jwt.audience,
        subject: TokenService.REFRESH_TOKEN_JWT_SUBJECT,
        secret: this.authenticationModuleOptions.jwt.secret,
        notBefore: 0,
        expiresIn:
          this.authenticationModuleOptions.refreshToken.expiresInSeconds,
      },
    );
  }

  validateRefreshToken(jwt: string): string {
    try {
      return this.jwtService.verify<{ id: string }>(jwt, {
        algorithms: [this.authenticationModuleOptions.jwt.algorithm],
        issuer: this.authenticationModuleOptions.jwt.issuer,
        audience: this.authenticationModuleOptions.jwt.audience,
        subject: TokenService.REFRESH_TOKEN_JWT_SUBJECT,
        secret: this.authenticationModuleOptions.jwt.secret,
      }).id;
    } catch {
      throw new UnauthorizedException('Invalid refresh-token.');
    }
  }
}
