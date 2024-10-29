import { Inject, Module } from '@nestjs/common';

import { ForgotPasswordController } from './controller/forgot-password.controller';
import { ResetPasswordController } from './controller/reset-password.controller';
import {
  PASSWORD_RESET_MODULE_OPTIONS_TOKEN,
  PasswordResetConfigurableModuleClass,
} from './password-reset.module-definition';
import {
  PasswordResetModuleOptions,
  passwordResetModuleOptionsValidationSchema,
} from './password-reset.module-options';
import { NotificationService } from './service/notification.service';
import { PasswordResetService } from './service/password-reset.service';
import { ResetPasswordService } from './service/reset-password.service';
import { UserResolverService } from './service/user-resolver.service';

@Module({
  controllers: [ForgotPasswordController, ResetPasswordController],
  providers: [
    PasswordResetService,
    UserResolverService,
    NotificationService,
    ResetPasswordService,
  ],
})
export class PasswordResetModule extends PasswordResetConfigurableModuleClass {
  constructor(
    @Inject(PASSWORD_RESET_MODULE_OPTIONS_TOKEN)
    passwordResetModuleOptions: PasswordResetModuleOptions,
  ) {
    super();

    // Validate the configuration object passed to the module.
    passwordResetModuleOptionsValidationSchema.parse(
      passwordResetModuleOptions,
    );
  }
}
