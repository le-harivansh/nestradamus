import { Inject, Module } from '@nestjs/common';

import { PasswordConfirmationController } from './controller/password-confirmation.controller';
import {
  PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN,
  PasswordConfirmationConfigurableModuleClass,
} from './password-confirmation.module-definition';
import {
  PasswordConfirmationModuleOptions,
  passwordConfirmationModuleOptionsValidationSchema,
} from './password-confirmation.module-options';
import { CookieService } from './service/cookie.service';
import { ResponseService } from './service/response.service';
import { UserCallbackService } from './service/user-callback.service';

@Module({
  controllers: [PasswordConfirmationController],
  providers: [CookieService, UserCallbackService, ResponseService],
  exports: [
    PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN,
    UserCallbackService,
    CookieService,
    ResponseService,
  ],
})
export class PasswordConfirmationModule extends PasswordConfirmationConfigurableModuleClass {
  constructor(
    @Inject(PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN)
    passwordConfirmationModuleOptions: PasswordConfirmationModuleOptions,
  ) {
    super();

    // Validate the configuration object passed to the module.
    passwordConfirmationModuleOptionsValidationSchema.parse(
      passwordConfirmationModuleOptions,
    );
  }
}
