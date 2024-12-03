import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Request,
  Response,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { AuthenticatedUserDecoratorFactory } from '../decorator/authenticated-user.decorator-factory';
import { LoginDto } from '../dto/login.dto';
import { HookService } from '../service/hook.service';
import { ResponseService } from '../service/response.service';
import { UserCallbackService } from '../service/user-callback.service';

@Controller()
export class LoginController {
  constructor(
    @Inject(AUTHENTICATION_MODULE_OPTIONS_TOKEN)
    authenticationModuleOptions: AuthenticationModuleOptions,

    private readonly userCallbackService: UserCallbackService,
    private readonly responseService: ResponseService,
    private readonly hookService: HookService,
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

    /**
     * Setup decorator that will retrieve the authenticated user from the
     * request.
     */
    const AuthenticatedUser = AuthenticatedUserDecoratorFactory(
      authenticationModuleOptions.requestPropertyHoldingAuthenticatedUser,
    );

    /**
     * Inject the authenticated user into the third argument of the controller's
     * method.
     */
    AuthenticatedUser()(this, LoginController.prototype.logout.name, 2);
  }

  /**
   * Login
   */
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async login(
    @Request() request: ExpressRequest,
    @Body() { username, password }: LoginDto,
    @Response({ passthrough: true }) response: ExpressResponse,
  ) {
    const authenticatedUser =
      await this.userCallbackService.retrieveUser(username);

    if (authenticatedUser === null) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const passwordIsValid = await this.userCallbackService.validatePassword(
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
    ]);

    await this.hookService.postLogin(request, response, authenticatedUser);
  }

  /**
   * Logout
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Request() request: ExpressRequest,
    @Response({ passthrough: true }) response: ExpressResponse,
    authenticatedUser: unknown,
  ) {
    this.responseService.clearAccessTokenCookie(response);
    this.responseService.clearRefreshTokenCookie(response);

    await this.hookService.postLogout(request, response, authenticatedUser);
  }
}
