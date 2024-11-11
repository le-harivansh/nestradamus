import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Response,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { LoginDto } from '../dto/login.dto';
import { PasswordValidationService } from '../service/password-validation.service';
import { ResponseService } from '../service/response.service';
import { UserRetrievalService } from '../service/user-retrieval.service';

@Controller()
export class LoginController {
  constructor(
    @Inject(AUTHENTICATION_MODULE_OPTIONS_TOKEN)
    authenticationModuleOptions: AuthenticationModuleOptions,

    private readonly userRetrievalService: UserRetrievalService,
    private readonly passwordValidationService: PasswordValidationService,
    private readonly responseService: ResponseService,
  ) {
    /**
     * Setup 'Dynamic' routing.
     *
     * The routes are retrieved from the resolved module options; and then
     * set-up manually using route decorator functions.
     */

    // Login route
    Post(authenticationModuleOptions.route.login)(
      this,
      LoginController.prototype.login.name,
      Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(this),
        LoginController.prototype.login.name,
      )!,
    );

    // Logout route
    Delete(authenticationModuleOptions.route.login)(
      this,
      LoginController.prototype.logout.name,
      Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(this),
        LoginController.prototype.logout.name,
      )!,
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
      await this.userRetrievalService.retrieveUser(username);

    if (authenticatedUser === null) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const passwordIsValid =
      await this.passwordValidationService.validatePassword(
        authenticatedUser,
        password,
      );

    if (!passwordIsValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    await Promise.all([
      this.responseService.setAccessTokenCookieForUserInResponse(
        authenticatedUser,
        response,
      ),
      this.responseService.setRefreshTokenCookieForUserInResponse(
        authenticatedUser,
        response,
      ),
      this.responseService.setPasswordConfirmationCookieForUserInResponse(
        authenticatedUser,
        response,
      ),
    ]);
  }

  /**
   * Logout
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Response({ passthrough: true }) response: ExpressResponse) {
    this.responseService.clearAccessTokenCookie(response);
    this.responseService.clearRefreshTokenCookie(response);
    this.responseService.clearPasswordConfirmationCookie(response);
  }
}
