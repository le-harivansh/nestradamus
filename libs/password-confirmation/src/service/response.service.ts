import { Inject, Injectable } from '@nestjs/common';
import { Response } from 'express';

import { PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN } from '../password-confirmation.module-definition';
import { PasswordConfirmationModuleOptions } from '../password-confirmation.module-options';
import { CookieService } from './cookie.service';

@Injectable()
export class ResponseService {
  constructor(
    @Inject(PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN)
    private readonly passwordConfirmationModuleOptions: PasswordConfirmationModuleOptions,

    private readonly cookieService: CookieService,
  ) {}

  async setPasswordConfirmationCookieForUserInResponse(
    user: unknown,
    response: Response,
  ): Promise<void> {
    const payload = await this.cookieService.createPayload(user);

    response.cookie(
      this.passwordConfirmationModuleOptions.cookie.name,
      payload,
      {
        ...CookieService.COOKIE_OPTIONS,
        maxAge:
          this.passwordConfirmationModuleOptions.cookie.expiresInSeconds * 1000,
      },
    );
  }

  clearPasswordConfirmationCookie(response: Response): void {
    response.clearCookie(
      this.passwordConfirmationModuleOptions.cookie.name,
      CookieService.COOKIE_OPTIONS,
    );
  }
}
