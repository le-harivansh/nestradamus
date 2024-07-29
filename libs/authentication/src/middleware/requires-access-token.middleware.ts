import {
  Inject,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { AccessTokenCallbackService } from '../service/access-token-callback.service';
import { TokenService } from '../service/token.service';

@Injectable()
export class RequiresAccessTokenMiddleware implements NestMiddleware {
  constructor(
    @Inject(AUTHENTICATION_MODULE_OPTIONS_TOKEN)
    private readonly authenticationModuleOptions: AuthenticationModuleOptions,

    private readonly accessTokenCallbackService: AccessTokenCallbackService,
    private readonly tokenService: TokenService,
  ) {}

  async use(request: Request, _response: Response, next: () => void) {
    const jwtPayload = await this.tokenService.validateAccessToken(
      request.signedCookies[
        this.authenticationModuleOptions.cookie.accessToken.name
      ],
    );

    const authenticatedUser =
      await this.accessTokenCallbackService.resolveUserFromJwtPayload(
        jwtPayload,
      );

    if (authenticatedUser === null) {
      throw new UnauthorizedException(
        'Could not resolve user from access-token.',
      );
    }

    (request as unknown as Record<string, unknown>)[
      this.authenticationModuleOptions.requestPropertyHoldingAuthenticatedUser
    ] = authenticatedUser;

    next();
  }
}
