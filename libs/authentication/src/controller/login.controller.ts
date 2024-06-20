import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Response,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { LoginDto } from '../dto/login.dto';
import { CredentialValidationService } from '../service/credential-validation.service';
import { ResponseService } from '../service/response.service';

@Controller()
export class LoginController {
  constructor(
    @Inject(AUTHENTICATION_MODULE_OPTIONS_TOKEN)
    private readonly authenticationModuleOptions: AuthenticationModuleOptions,

    private readonly credentialValidationService: CredentialValidationService,
    private readonly responseService: ResponseService,
  ) {
    /**
     * Setup 'Dynamic' routing.
     *
     * The routes are retrieved from the resolved module options; and then
     * set-up manually using route decorator functions.
     */

    // Login route
    Post(this.authenticationModuleOptions.routes.login.withCredentials)(
      this,
      LoginController.prototype.login.name,
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), LoginController.prototype.login.name)!,
    );

    // Logout route
    Delete(this.authenticationModuleOptions.routes.login.withCredentials)(
      this,
      LoginController.prototype.logout.name,
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), LoginController.prototype.logout.name)!,
    );
  }

  /**
   * Login
   */
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async login(
    @Body() { username, password }: LoginDto,
    @Response({ passthrough: true }) response: ExpressResponse,
  ) {
    const authenticatedUser =
      await this.credentialValidationService.validateUsernameAndPassword(
        username,
        password,
      );

    this.responseService.setAccessTokenCookieForUserInResponse(authenticatedUser, response);
    this.responseService.setRefreshTokenCookieForUserInResponse(authenticatedUser, response);
  }

  /**
   * Logout
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Response({ passthrough: true }) response: ExpressResponse) {
    this.responseService.clearAccessTokenCookie(response);
    this.responseService.clearRefreshTokenCookie(response);
  }
}
