import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { seconds, Throttle } from '@nestjs/throttler';

import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { PASSWORD_RESET_MODULE_OPTIONS_TOKEN } from '../password-reset.module-definition';
import { PasswordResetModuleOptions } from '../password-reset.module-options';
import { NotificationService } from '../service/notification.service';
import { PasswordResetService } from '../service/password-reset.service';
import { UserResolverService } from '../service/user-resolver.service';

@Controller()
export class ForgotPasswordController {
  constructor(
    @Inject(PASSWORD_RESET_MODULE_OPTIONS_TOKEN)
    passwordResetModuleOptions: PasswordResetModuleOptions,
    private readonly userResolverService: UserResolverService,
    private readonly passwordResetService: PasswordResetService,
    private readonly notificationService: NotificationService,
  ) {
    /**
     * Setup 'Dynamic' routing.
     *
     * The routes are retrieved from the resolved module options; and then
     * set-up manually using route decorator functions.
     */

    // Forgot-Password route
    Post(passwordResetModuleOptions.route.forgotPassword)(
      this,
      ForgotPasswordController.prototype.forgotPassword.name,
      Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(this),
        ForgotPasswordController.prototype.forgotPassword.name,
      )!,
    );
  }

  @ApiOperation({
    summary:
      "Send a 'forgot-password' message (e-mail/sms/etc...) to a registered user.",
  })
  @ApiNoContentResponse({
    description:
      "A 'forgot-password' message (e-mail/sms/etc...) was successfully sent to the user.",
  })
  @ApiBadRequestResponse({ description: 'An invalid username was provided.' })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests came from the same origin.',
  })
  @Throttle({ default: { limit: 2, ttl: seconds(60) } })
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async forgotPassword(@Body() { username }: ForgotPasswordDto) {
    try {
      const user = await this.userResolverService.resolveUser(username);
      const passwordReset = await this.passwordResetService.create(user);

      await this.notificationService.notifyUser(user, passwordReset);
    } catch (exception) {
      if (exception instanceof NotFoundException) {
        /**
         * If a user could not be found, we still want to return a HTTP 204
         * response; since we do not want to expose an endpoint which can be used
         * to query whether a user is registered in the application.
         */

        return;
      }

      /**
       * Re-throw any other exception.
       */
      throw new InternalServerErrorException(
        (exception as { message?: string })?.message ??
          'An error occured while trying to notify the user.',
      );
    }
  }
}
