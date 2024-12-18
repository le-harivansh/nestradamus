import { Inject, Injectable } from '@nestjs/common';
import { Response } from 'express';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { TokenService } from './token.service';

@Injectable()
export class ResponseService {
  constructor(
    @Inject(AUTHENTICATION_MODULE_OPTIONS_TOKEN)
    private readonly authenticationModuleOptions: AuthenticationModuleOptions,

    private readonly tokenService: TokenService,
  ) {}

  async setAccessTokenCookieForUserInResponse(
    user: unknown,
    response: Response,
  ): Promise<void> {
    const accessTokenJwt = await this.tokenService.createAccessToken(user);

    response.cookie(
      this.authenticationModuleOptions.cookie.accessToken.name,
      accessTokenJwt,
      {
        ...TokenService.COOKIE_OPTIONS,
        maxAge:
          this.authenticationModuleOptions.cookie.accessToken.expiresInSeconds *
          1000,
      },
    );
  }

  async setRefreshTokenCookieForUserInResponse(
    user: unknown,
    response: Response,
  ): Promise<void> {
    const refreshTokenJwt = await this.tokenService.createRefreshToken(user);

    response.cookie(
      this.authenticationModuleOptions.cookie.refreshToken.name,
      refreshTokenJwt,
      {
        ...TokenService.COOKIE_OPTIONS,
        maxAge:
          this.authenticationModuleOptions.cookie.refreshToken
            .expiresInSeconds * 1000,
      },
    );
  }

  clearAccessTokenCookie(response: Response): void {
    response.clearCookie(
      this.authenticationModuleOptions.cookie.accessToken.name,
      TokenService.COOKIE_OPTIONS,
    );
  }

  clearRefreshTokenCookie(response: Response): void {
    response.clearCookie(
      this.authenticationModuleOptions.cookie.refreshToken.name,
      TokenService.COOKIE_OPTIONS,
    );
  }
}
