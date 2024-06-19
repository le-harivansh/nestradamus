import { Inject, Injectable } from '@nestjs/common';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';

@Injectable()
export class UserIdExtractorService {
  private readonly extractUserId!: (user: unknown) => string;

  constructor(
    @Inject(AUTHENTICATION_MODULE_OPTIONS_TOKEN)
    authenticationModuleOptions: AuthenticationModuleOptions,
  ) {
    this.extractUserId = authenticationModuleOptions.callbacks.extractUserId;
  }

  public extractId(user: unknown): string {
    return this.extractUserId(user);
  }
}
