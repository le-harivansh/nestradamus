import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { AUTHORIZATION_MODULE_OPTIONS_TOKEN } from '../authorization.module-definition';
import { AuthorizationModuleOptions } from '../authorization.module-options';

@Injectable()
export class UserCallbackService {
  constructor(
    @Inject(AUTHORIZATION_MODULE_OPTIONS_TOKEN)
    private readonly authorizationModuleOptions: AuthorizationModuleOptions,
  ) {}

  async retrieveFrom(request: unknown): Promise<unknown> {
    const user: unknown =
      await this.authorizationModuleOptions.user.retrieveFromRequest(request);

    if (!user) {
      throw new UnauthorizedException('User not found in request.');
    }

    return user;
  }

  async getPermissionsFor(user: unknown) {
    return await this.authorizationModuleOptions.user.getPermissions(user);
  }
}
