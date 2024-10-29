import { Inject, Injectable } from '@nestjs/common';

import { PASSWORD_RESET_MODULE_OPTIONS_TOKEN } from '../password-reset.module-definition';
import { PasswordResetModuleOptions } from '../password-reset.module-options';

@Injectable()
export class UserResolverService {
  constructor(
    @Inject(PASSWORD_RESET_MODULE_OPTIONS_TOKEN)
    private readonly passwordResetModuleOptions: PasswordResetModuleOptions,
  ) {}

  async resolveUser(username: string): Promise<unknown> {
    return await this.passwordResetModuleOptions.callback.resolveUser(username);
  }
}
