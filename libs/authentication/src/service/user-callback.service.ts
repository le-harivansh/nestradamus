import { Inject, Injectable } from '@nestjs/common';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';

@Injectable()
export class UserCallbackService {
  constructor(
    @Inject(AUTHENTICATION_MODULE_OPTIONS_TOKEN)
    private readonly authenticationModuleOptions: AuthenticationModuleOptions,
  ) {}

  retrieveUser(username: string): Promise<unknown> {
    return this.authenticationModuleOptions.callback.user.retrieve(username);
  }

  validatePassword(user: unknown, password: string): Promise<boolean> {
    return this.authenticationModuleOptions.callback.user.validatePassword(
      user,
      password,
    );
  }
}
