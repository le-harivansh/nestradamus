import { Inject, Injectable } from '@nestjs/common';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';

@Injectable()
export class RefreshTokenCallbackService {
  constructor(
    @Inject(AUTHENTICATION_MODULE_OPTIONS_TOKEN)
    private readonly authenticationModuleOptions: AuthenticationModuleOptions,
  ) {}

  async createJwtPayload(user: unknown): Promise<Record<string, unknown>> {
    return await this.authenticationModuleOptions.callback.refreshToken.createJwtPayload(
      user,
    );
  }

  async validateJwtPayload(payload: Record<string, unknown>): Promise<boolean> {
    return await this.authenticationModuleOptions.callback.refreshToken.validateJwtPayload(
      payload,
    );
  }

  async resolveUserFromJwtPayload(
    payload: Record<string, unknown>,
  ): Promise<unknown | null> {
    return await this.authenticationModuleOptions.callback.refreshToken.resolveUserFromJwtPayload(
      payload,
    );
  }
}
