import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ObjectId } from 'mongodb';

import { ResetPasswordDto } from '../dto/reset-password.dto';
import { PASSWORD_RESET_MODULE_OPTIONS_TOKEN } from '../password-reset.module-definition';
import { PasswordResetModuleOptions } from '../password-reset.module-options';
import { PasswordResetService } from '../service/password-reset.service';
import { ResetPasswordService } from '../service/reset-password.service';

@Controller()
export class ResetPasswordController {
  constructor(
    @Inject(PASSWORD_RESET_MODULE_OPTIONS_TOKEN)
    passwordResetModuleOptions: PasswordResetModuleOptions,
    private readonly passwordResetService: PasswordResetService,
    private readonly resetPasswordService: ResetPasswordService,
  ) {
    /**
     * Setup 'Dynamic' routing.
     *
     * The routes are retrieved from the resolved module options; and then
     * set-up manually using route decorator functions.
     */

    // Get Password-Reset record
    Get(passwordResetModuleOptions.route.resetPassword)(
      this,
      ResetPasswordController.prototype.getPasswordReset.name,
      Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(this),
        ResetPasswordController.prototype.getPasswordReset.name,
      )!,
    );

    // Update user password
    Post(passwordResetModuleOptions.route.resetPassword)(
      this,
      ResetPasswordController.prototype.updateUserPassword.name,
      Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(this),
        ResetPasswordController.prototype.updateUserPassword.name,
      )!,
    );
  }

  @ApiOperation({ summary: "Retrieve a user's 'password-reset' record." })
  @ApiParam({
    name: 'id',
    required: true,
    description: "The 'id' of the 'password-reset' record to retrieve.",
    example: new ObjectId(),
  })
  @ApiOkResponse({
    description:
      "The specified 'password-reset' record was successfully retrieved.",
    example: {
      _id: new ObjectId(),
      createdAt: new Date(),
      user: {
        _id: new ObjectId(),
        firstName: 'FirstName',
        lastName: 'LastName',
        email: 'user@email.dev',
      },
    },
  })
  @ApiNotFoundResponse({
    description: "The specified 'password-reset' record could not be found.",
  })
  getPasswordReset(@Param('id') passwordResetId: string) {
    return this.passwordResetService.findById(passwordResetId);
  }

  @ApiOperation({ summary: "Reset a user's password." })
  @ApiParam({
    name: 'id',
    required: true,
    description:
      "The 'id' of the 'password-reset' record for this update operation.",
    example: new ObjectId(),
  })
  @ApiNoContentResponse({
    description: "The user's password was successfully reset.",
  })
  @ApiNotFoundResponse({
    description: "The specified 'password-reset' record could not be found.",
  })
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateUserPassword(
    @Param('id') passwordResetId: string,
    @Body() { newPassword }: ResetPasswordDto,
  ) {
    const passwordReset =
      await this.passwordResetService.findById(passwordResetId);

    await this.resetPasswordService.resetUserPassword(
      passwordReset,
      newPassword,
    );

    await this.passwordResetService.delete(passwordResetId);
  }
}
