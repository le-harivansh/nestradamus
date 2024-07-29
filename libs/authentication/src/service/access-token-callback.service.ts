import { Inject, Injectable } from '@nestjs/common';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';

@Injectable()
export class AccessTokenCallbackService {
  constructor(
    @Inject(AUTHENTICATION_MODULE_OPTIONS_TOKEN)
    private readonly authenticationModuleOptions: AuthenticationModuleOptions,
  ) {}

  createJwtPayload(user: unknown): Promise<Record<string, unknown>> {
    return this.authenticationModuleOptions.callback.accessToken.createJwtPayload(
      user,
    );
  }

  validateJwtPayload(payload: Record<string, unknown>): Promise<boolean> {
    return this.authenticationModuleOptions.callback.accessToken.validateJwtPayload(
      payload,
    );
  }

  resolveUserFromJwtPayload(
    payload: Record<string, unknown>,
  ): Promise<unknown> {
    return this.authenticationModuleOptions.callback.accessToken.resolveUserFromJwtPayload(
      payload,
    );
  }
}
