import { Inject, Injectable } from '@nestjs/common';

import { PASSWORD_RESET_MODULE_OPTIONS_TOKEN } from '../password-reset.module-definition';
import { PasswordResetModuleOptions } from '../password-reset.module-options';

@Injectable()
export class ResetPasswordService {
  constructor(
    @Inject(PASSWORD_RESET_MODULE_OPTIONS_TOKEN)
    private readonly passwordResetModuleOptions: PasswordResetModuleOptions,
  ) {}

  async resetUserPassword(
    passwordReset: unknown,
    newPassword: string,
  ): Promise<void> {
    await this.passwordResetModuleOptions.callback.resetUserPassword(
      passwordReset,
      newPassword,
    );
  }
}
