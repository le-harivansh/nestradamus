import { Inject, Injectable } from "@nestjs/common";
import { Response } from "express";
import { AuthenticationModuleOptions } from "../authentication.module-options";
import { TokenService } from "./token.service";
import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from "../authentication.module-definition";

@Injectable()
export class ResponseService {
  constructor(
    @Inject(AUTHENTICATION_MODULE_OPTIONS_TOKEN)
    private readonly authenticationModuleOptions: AuthenticationModuleOptions,

    private readonly tokenService: TokenService
  ) {}

  setAccessTokenCookieForUserInResponse(user: unknown, response: Response): void {
    response.cookie(
      this.authenticationModuleOptions.accessToken.cookieName,
      this.tokenService.createAccessTokenForUser(user),
      {
        ...TokenService.COOKIE_OPTIONS,
        maxAge:
          this.authenticationModuleOptions.accessToken.expiresInSeconds * 1000,
      },
    );
  }

  setRefreshTokenCookieForUserInResponse(user: unknown, response: Response): void {
    response.cookie(
      this.authenticationModuleOptions.refreshToken.cookieName,
      this.tokenService.createRefreshTokenForUser(user),
      {
        ...TokenService.COOKIE_OPTIONS,
        maxAge:
          this.authenticationModuleOptions.refreshToken.expiresInSeconds * 1000,
      },
    );
  }

  clearAccessTokenCookie(response: Response): void {
    response.clearCookie(
      this.authenticationModuleOptions.accessToken.cookieName,
      TokenService.COOKIE_OPTIONS,
    );
  }

  clearRefreshTokenCookie(response: Response): void {
    response.clearCookie(
      this.authenticationModuleOptions.refreshToken.cookieName,
      TokenService.COOKIE_OPTIONS,
    );
  }
}
