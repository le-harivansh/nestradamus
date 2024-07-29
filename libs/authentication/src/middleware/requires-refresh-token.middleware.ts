import {
  Inject,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { RefreshTokenCallbackService } from '../service/refresh-token-callback.service';
import { TokenService } from '../service/token.service';

@Injectable()
export class RequiresRefreshTokenMiddleware implements NestMiddleware {
  constructor(
    @Inject(AUTHENTICATION_MODULE_OPTIONS_TOKEN)
    private readonly authenticationModuleOptions: AuthenticationModuleOptions,

    private readonly refreshTokenCallbackService: RefreshTokenCallbackService,
    private readonly tokenService: TokenService,
  ) {}

  async use(request: Request, _response: Response, next: () => void) {
    const jwtPayload = await this.tokenService.validateRefreshToken(
      request.signedCookies[
        this.authenticationModuleOptions.cookie.refreshToken.name
      ],
    );

    const authenticatedUser =
      await this.refreshTokenCallbackService.resolveUserFromJwtPayload(
        jwtPayload,
      );

    if (authenticatedUser === null) {
      throw new UnauthorizedException(
        'Could not resolve user from refresh-token.',
      );
    }

    (request as unknown as Record<string, unknown>)[
      this.authenticationModuleOptions.requestPropertyHoldingAuthenticatedUser
    ] = authenticatedUser;

    next();
  }
}
