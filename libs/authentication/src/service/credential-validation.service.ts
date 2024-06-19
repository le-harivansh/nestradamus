import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { UserResolverService } from './user-resolver.service';

@Injectable()
export class CredentialValidationService {
  private readonly _validatePassword!: (
    user: unknown,
    password: string,
  ) => Promise<boolean>;

  constructor(
    @Inject(AUTHENTICATION_MODULE_OPTIONS_TOKEN)
    authenticationModuleOptions: AuthenticationModuleOptions,

    private readonly userResolverService: UserResolverService,
  ) {
    this._validatePassword =
      authenticationModuleOptions.callbacks.validatePassword;
  }

  async validateUsernameAndPassword(
    username: string,
    password: string,
  ): Promise<unknown> {
    const userToAuthenticate =
      await this.userResolverService.resolveByUsername(username);

    if (
      userToAuthenticate === null ||
      !(await this.validatePassword(userToAuthenticate, password))
    ) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return userToAuthenticate;
  }

  private validatePassword(user: unknown, password: string): Promise<boolean> {
    return this._validatePassword(user, password);
  }
}
