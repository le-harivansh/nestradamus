import { Inject, Injectable } from '@nestjs/common';

import { PASSWORD_RESET_MODULE_OPTIONS_TOKEN } from '../password-reset.module-definition';
import { PasswordResetModuleOptions } from '../password-reset.module-options';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(PASSWORD_RESET_MODULE_OPTIONS_TOKEN)
    private readonly passwordResetModuleOptions: PasswordResetModuleOptions,
  ) {}

  async notifyUser(user: unknown, passwordReset: unknown): Promise<void> {
    return await this.passwordResetModuleOptions.callback.notifyUser(
      user,
      passwordReset,
    );
  }
}
