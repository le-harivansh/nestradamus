import { Inject, Injectable } from '@nestjs/common';

import { PASSWORD_RESET_MODULE_OPTIONS_TOKEN } from '../password-reset.module-definition';
import { PasswordResetModuleOptions } from '../password-reset.module-options';

@Injectable()
export class PasswordResetService {
  constructor(
    @Inject(PASSWORD_RESET_MODULE_OPTIONS_TOKEN)
    private readonly passwordResetModuleOptions: PasswordResetModuleOptions,
  ) {}

  async findById(id: string) {
    return await this.passwordResetModuleOptions.callback.retrievePasswordReset(
      id,
    );
  }

  async create(user: unknown) {
    return await this.passwordResetModuleOptions.callback.createPasswordReset(
      user,
    );
  }

  async delete(id: string) {
    return await this.passwordResetModuleOptions.callback.deletePasswordReset(
      id,
    );
  }
}
