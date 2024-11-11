import { Inject, Injectable } from '@nestjs/common';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';

@Injectable()
export class PasswordConfirmationCallbackService {
  constructor(
    @Inject(AUTHENTICATION_MODULE_OPTIONS_TOKEN)
    private readonly authenticationModuleOptions: AuthenticationModuleOptions,
  ) {}

  createCookiePayload(user: unknown): Promise<string> {
    return this.authenticationModuleOptions.callback.passwordConfirmation.createCookiePayload(
      user,
    );
  }

  validateCookiePayload(user: unknown, payload: string): Promise<boolean> {
    return this.authenticationModuleOptions.callback.passwordConfirmation.validateCookiePayload(
      user,
      payload,
    );
  }
}
