import {
  Inject,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { TokenService } from '../service/token.service';
import { UserResolverService } from '../service/user-resolver.service';

@Injectable()
export class RequiresRefreshTokenMiddleware implements NestMiddleware {
  constructor(
    @Inject(AUTHENTICATION_MODULE_OPTIONS_TOKEN)
    private readonly authenticationModuleOptions: AuthenticationModuleOptions,

    private readonly userResolverService: UserResolverService,
    private readonly tokenService: TokenService,
  ) {}

  async use(request: Request, _response: Response, next: () => void) {
    const authenticatedUserId = this.tokenService.validateRefreshToken(
      request.signedCookies[
        this.authenticationModuleOptions.refreshToken.cookieName
      ],
    );

    const authenticatedUser =
      await this.userResolverService.resolveById(authenticatedUserId);

    if (authenticatedUser === null) {
      throw new UnauthorizedException('Invalid user-id in refresh-token.');
    }

    (request as any)[
      this.authenticationModuleOptions.requestPropertyHoldingAuthenticatedUser
    ] = authenticatedUser;

    next();
  }
}