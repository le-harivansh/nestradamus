import { Inject, Injectable } from '@nestjs/common';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';

@Injectable()
export class HookService {
  constructor(
    @Inject(AUTHENTICATION_MODULE_OPTIONS_TOKEN)
    private readonly authenticationModuleOptions: AuthenticationModuleOptions,
  ) {}

  async postLogin(
    request: unknown,
    response: unknown,
    authenticatedUser: unknown,
  ) {
    return await this.authenticationModuleOptions.hook.post.login(
      request,
      response,
      authenticatedUser,
    );
  }

  async postLogout(
    request: unknown,
    response: unknown,
    authenticatedUser: unknown,
  ) {
    return await this.authenticationModuleOptions.hook.post.logout(
      request,
      response,
      authenticatedUser,
    );
  }
}
