import {
  Body,
  Controller,
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
import { AuthenticatedUserDecoratorFactory } from '../decorator/authenticated-user.decorator-factory';
import { PasswordConfirmationDto } from '../dto/password-confirmation.dto';
import { PasswordValidationService } from '../service/password-validation.service';
import { ResponseService } from '../service/response.service';

@Controller()
export class PasswordConfirmationController {
  constructor(
    @Inject(AUTHENTICATION_MODULE_OPTIONS_TOKEN)
    authenticationModuleOptions: AuthenticationModuleOptions,

    private readonly passwordValidationService: PasswordValidationService,
    private readonly responseService: ResponseService,
  ) {
    /**
     * Setup decorator that will retrieve the authenticated user from the
     * request.
     */
    const AuthenticatedUser = AuthenticatedUserDecoratorFactory(
      authenticationModuleOptions.requestPropertyHoldingAuthenticatedUser,
    );

    /**
     * Setup 'Dynamic' routing.
     *
     * The routes are retrieved from the resolved module options; and then
     * set-up manually using route decorator functions.
     */
    Post(authenticationModuleOptions.route.passwordConfirmation)(
      this,
      PasswordConfirmationController.prototype.confirmPassword.name,
      Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(this),
        PasswordConfirmationController.prototype.confirmPassword.name,
      )!,
    );

    /**
     * Inject the authenticated user into the first argument of the controller's
     * method.
     */
    AuthenticatedUser()(
      this,
      PasswordConfirmationController.prototype.confirmPassword.name,
      0,
    );
  }

  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmPassword(
    user: unknown,
    @Body() { password }: PasswordConfirmationDto,
    @Response({ passthrough: true }) response: ExpressResponse,
  ) {
    const passwordIsValid =
      await this.passwordValidationService.validatePassword(user, password);

    if (!passwordIsValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    await this.responseService.setPasswordConfirmationCookieForUserInResponse(
      user,
      response,
    );
  }
}
