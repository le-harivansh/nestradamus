import { Inject, Injectable } from '@nestjs/common';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';

@Injectable()
export class UserResolverService {
  private readonly resolveUserById!: (id: string) => Promise<unknown>;
  private readonly resolveUserByUsername!: (
    username: string,
  ) => Promise<unknown>;

  constructor(
    @Inject(AUTHENTICATION_MODULE_OPTIONS_TOKEN)
    authenticationModuleOptions: AuthenticationModuleOptions,
  ) {
    this.resolveUserById =
      authenticationModuleOptions.callbacks.resolveUser.byId;

    this.resolveUserByUsername =
      authenticationModuleOptions.callbacks.resolveUser.byUsername;
  }

  resolveById(id: string): Promise<unknown> {
    return this.resolveUserById(id);
  }

  resolveByUsername(username: string): Promise<unknown> {
    return this.resolveUserByUsername(username);
  }
}
