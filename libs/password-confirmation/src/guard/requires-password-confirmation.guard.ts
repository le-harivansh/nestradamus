import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN } from '../password-confirmation.module-definition';
import { PasswordConfirmationModuleOptions } from '../password-confirmation.module-options';
import { CookieService } from '../service/cookie.service';
import { UserCallbackService } from '../service/user-callback.service';

@Injectable()
export class RequiresPasswordConfirmation implements CanActivate {
  constructor(
    @Inject(PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN)
    private readonly passwordConfirmationModuleOptions: PasswordConfirmationModuleOptions,

    private readonly userCallbackService: UserCallbackService,
    private readonly cookieService: CookieService,
  ) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const authenticatedUser = this.userCallbackService.retrieveFrom(request);

    if (!authenticatedUser) {
      throw new UnauthorizedException(
        'Could not find the authenticated user on the request.',
      );
    }

    const cookiePayload: string =
      request.signedCookies[this.passwordConfirmationModuleOptions.cookie.name];

    if (!cookiePayload) {
      throw new UnauthorizedException(
        `The '${this.passwordConfirmationModuleOptions.cookie.name}' cookie is not present on the request.`,
      );
    }

    return this.cookieService.validatePayload(authenticatedUser, cookiePayload);
  }
}
