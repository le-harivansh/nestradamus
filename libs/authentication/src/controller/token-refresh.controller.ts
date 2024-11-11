import {
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Response,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { AuthenticatedUserDecoratorFactory } from '../decorator/authenticated-user.decorator-factory';
import { ResponseService } from '../service/response.service';

@Controller()
export class TokenRefreshController {
  constructor(
    @Inject(AUTHENTICATION_MODULE_OPTIONS_TOKEN)
    authenticationModuleOptions: AuthenticationModuleOptions,

    private readonly responseService: ResponseService,
  ) {
    /**
     * Setup 'Dynamic' routing.
     *
     * The routes are retrieved from the resolved module options; and then
     * set-up manually using route decorator functions.
     */

    // Refresh `Access-Token` route
    Post(authenticationModuleOptions.route.tokenRefresh.accessToken)(
      this,
      TokenRefreshController.prototype.refreshAccessToken.name,
      Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(this),
        TokenRefreshController.prototype.refreshAccessToken.name,
      )!,
    );

    // Refresh `Refresh-Token` route
    Post(authenticationModuleOptions.route.tokenRefresh.refreshToken)(
      this,
      TokenRefreshController.prototype.refreshRefreshToken.name,
      Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(this),
        TokenRefreshController.prototype.refreshRefreshToken.name,
      )!,
    );

    // Setup decorator that will retrieve the authenticated user from the request.
    const AuthenticatedUser = AuthenticatedUserDecoratorFactory(
      authenticationModuleOptions.requestPropertyHoldingAuthenticatedUser,
    );

    // Apply parameter-decorators that will inject the authenticated user into the controller method.
    AuthenticatedUser()(
      this,
      TokenRefreshController.prototype.refreshAccessToken.name,
      0,
    );
    AuthenticatedUser()(
      this,
      TokenRefreshController.prototype.refreshRefreshToken.name,
      0,
    );
  }

  /**
   * Refresh access-token
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  refreshAccessToken(
    user: unknown,
    @Response({ passthrough: true }) response: ExpressResponse,
  ) {
    this.responseService.setAccessTokenCookieForUserInResponse(user, response);
  }

  /**
   * Refresh refresh-token
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  refreshRefreshToken(
    user: unknown,
    @Response({ passthrough: true }) response: ExpressResponse,
  ) {
    this.responseService.setRefreshTokenCookieForUserInResponse(user, response);
  }
}
