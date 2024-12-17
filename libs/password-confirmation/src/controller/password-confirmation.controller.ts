import {
  Body,
  Controller,
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
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';

import { PasswordConfirmationDto } from '../dto/password-confirmation.dto';
import { PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN } from '../password-confirmation.module-definition';
import { PasswordConfirmationModuleOptions } from '../password-confirmation.module-options';
import { ResponseService } from '../service/response.service';
import { UserCallbackService } from '../service/user-callback.service';

@Controller()
export class PasswordConfirmationController {
  constructor(
    @Inject(PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN)
    passwordConfirmationModuleOptions: PasswordConfirmationModuleOptions,

    private readonly userCallbackService: UserCallbackService,
    private readonly responseService: ResponseService,
  ) {
    /**
     * Setup 'Dynamic' routing.
     *
     * The routes are retrieved from the resolved module options; and then
     * set-up manually using route decorator functions.
     */
    Post(passwordConfirmationModuleOptions.route)(
      this,
      PasswordConfirmationController.prototype.confirmPassword.name,
      Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(this),
        PasswordConfirmationController.prototype.confirmPassword.name,
      )!,
    );
  }

  @ApiCookieAuth()
  @ApiOperation({ summary: "Confirm the authenticated user's password." })
  @ApiNoContentResponse({
    description:
      "The authenticated user's password was successfully confirmed.",
  })
  @ApiBadRequestResponse({ description: 'An invalid password was provided.' })
  @ApiUnauthorizedResponse({ description: 'The wrong password was provided.' })
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmPassword(
    @Request() request: ExpressRequest,
    @Body() { password }: PasswordConfirmationDto,
    @Response({ passthrough: true }) response: ExpressResponse,
  ) {
    const authenticatedUser = this.userCallbackService.retrieveFrom(request);

    if (!authenticatedUser) {
      throw new UnauthorizedException('Could not retrieve authenticated user.');
    }

    const passwordIsValid = await this.userCallbackService.validatePassword(
      authenticatedUser,
      password,
    );

    if (!passwordIsValid) {
      throw new UnauthorizedException('Wrong password.');
    }

    await this.responseService.setPasswordConfirmationCookieForUserInResponse(
      authenticatedUser,
      response,
    );
  }
}
