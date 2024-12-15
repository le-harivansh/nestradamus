import { Inject, Injectable } from '@nestjs/common';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';

@Injectable()
export class UserCallbackService {
  constructor(
    @Inject(AUTHENTICATION_MODULE_OPTIONS_TOKEN)
    private readonly authenticationModuleOptions: AuthenticationModuleOptions,
  ) {}

  async retrieveUser(username: string): Promise<unknown> {
    return await this.authenticationModuleOptions.callback.user.retrieve(
      username,
    );
  }

  async validatePassword(user: unknown, password: string): Promise<boolean> {
    return await this.authenticationModuleOptions.callback.user.validatePassword(
      user,
      password,
    );
  }
}
