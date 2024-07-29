import { Inject, Injectable } from '@nestjs/common';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';

@Injectable()
export class RefreshTokenCallbackService {
  constructor(
    @Inject(AUTHENTICATION_MODULE_OPTIONS_TOKEN)
    private readonly authenticationModuleOptions: AuthenticationModuleOptions,
  ) {}

  createJwtPayload(user: unknown): Promise<Record<string, unknown>> {
    return this.authenticationModuleOptions.callback.refreshToken.createJwtPayload(
      user,
    );
  }

  validateJwtPayload(payload: Record<string, unknown>): Promise<boolean> {
    return this.authenticationModuleOptions.callback.refreshToken.validateJwtPayload(
      payload,
    );
  }

  resolveUserFromJwtPayload(
    payload: Record<string, unknown>,
  ): Promise<unknown | null> {
    return this.authenticationModuleOptions.callback.refreshToken.resolveUserFromJwtPayload(
      payload,
    );
  }
}
