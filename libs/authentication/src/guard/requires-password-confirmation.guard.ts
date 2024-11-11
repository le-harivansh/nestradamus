import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { PasswordConfirmationCallbackService } from '../service/password-confirmation-callback.service';

@Injectable()
export class RequiresPasswordConfirmation implements CanActivate {
  constructor(
    @Inject(AUTHENTICATION_MODULE_OPTIONS_TOKEN)
    private readonly authenticationModuleOptions: AuthenticationModuleOptions,

    private readonly passwordConfirmationCallbackService: PasswordConfirmationCallbackService,
  ) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const authenticatedUser = (request as unknown as { user: unknown }).user;

    if (!authenticatedUser) {
      throw new UnauthorizedException(
        'Could not find the authenticated user on the request.',
      );
    }

    const cookiePayload: string =
      request.signedCookies[
        this.authenticationModuleOptions.cookie.passwordConfirmation.name
      ];

    if (!cookiePayload) {
      throw new BadRequestException(
        'Could not retrieve the cookie payload from the request.',
      );
    }

    return this.passwordConfirmationCallbackService.validateCookiePayload(
      authenticatedUser,
      cookiePayload,
    );
  }
}
