import { Inject, Injectable } from '@nestjs/common';

import { PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN } from '../password-confirmation.module-definition';
import { PasswordConfirmationModuleOptions } from '../password-confirmation.module-options';

@Injectable()
export class UserCallbackService {
  constructor(
    @Inject(PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN)
    private readonly passwordConfirmationModuleOptions: PasswordConfirmationModuleOptions,
  ) {}

  retrieveFrom(request: unknown): unknown {
    return this.passwordConfirmationModuleOptions.callback.user.retrieveFrom(
      request,
    );
  }

  validatePassword(user: unknown, password: string): Promise<boolean> {
    return this.passwordConfirmationModuleOptions.callback.user.validatePassword(
      user,
      password,
    );
  }
}
