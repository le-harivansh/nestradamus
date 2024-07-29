import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';

@Injectable()
export class CredentialValidationService {
  constructor(
    @Inject(AUTHENTICATION_MODULE_OPTIONS_TOKEN)
    private readonly authenticationModuleOptions: AuthenticationModuleOptions,
  ) {}

  async validateCredentials(
    username: string,
    password: string,
  ): Promise<unknown> {
    const authenticatedUser =
      await this.authenticationModuleOptions.callback.validateCredentials(
        username,
        password,
      );

    if (authenticatedUser === null) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return authenticatedUser;
  }
}
