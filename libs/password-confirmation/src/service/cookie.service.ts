import { Inject, Injectable } from '@nestjs/common';
import { CookieOptions } from 'express';

import { PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN } from '../password-confirmation.module-definition';
import { PasswordConfirmationModuleOptions } from '../password-confirmation.module-options';

@Injectable()
export class CookieService {
  static readonly COOKIE_OPTIONS: Readonly<CookieOptions> = {
    secure: true,
    httpOnly: true,
    signed: true,
    sameSite: 'lax',
  } as const;

  constructor(
    @Inject(PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN)
    private readonly passwordConfirmationModuleOptions: PasswordConfirmationModuleOptions,
  ) {}

  createPayload(user: unknown): Promise<string> {
    return this.passwordConfirmationModuleOptions.callback.cookie.createPayload(
      user,
    );
  }

  validatePayload(user: unknown, payload: string): Promise<boolean> {
    return this.passwordConfirmationModuleOptions.callback.cookie.validatePayload(
      user,
      payload,
    );
  }
}
