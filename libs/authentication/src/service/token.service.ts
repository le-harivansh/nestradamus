import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CookieOptions } from 'express';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { JwtPayload } from '../interface/jwt-payload.interface';
import { UserIdExtractorService } from './user-id-extractor.service';

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

    private readonly userIdExtractorService: UserIdExtractorService,
    private readonly jwtService: JwtService,
  ) {}

  createAccessTokenForUser(user: unknown): string {
    return this.jwtService.sign(
      { id: this.userIdExtractorService.extractId(user) } as JwtPayload,
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

  validateAccessToken(jwt: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(jwt, {
        algorithms: [this.authenticationModuleOptions.jwt.algorithm],
        issuer: this.authenticationModuleOptions.jwt.issuer,
        audience: this.authenticationModuleOptions.jwt.audience,
        subject: TokenService.ACCESS_TOKEN_JWT_SUBJECT,
        secret: this.authenticationModuleOptions.jwt.secret,
      });
    } catch {
      throw new UnauthorizedException('Invalid access-token.');
    }
  }

  createRefreshTokenForUser(user: unknown): string {
    return this.jwtService.sign(
      { id: this.userIdExtractorService.extractId(user) } as JwtPayload,
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

  validateRefreshToken(jwt: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(jwt, {
        algorithms: [this.authenticationModuleOptions.jwt.algorithm],
        issuer: this.authenticationModuleOptions.jwt.issuer,
        audience: this.authenticationModuleOptions.jwt.audience,
        subject: TokenService.REFRESH_TOKEN_JWT_SUBJECT,
        secret: this.authenticationModuleOptions.jwt.secret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh-token.');
    }
  }
}
