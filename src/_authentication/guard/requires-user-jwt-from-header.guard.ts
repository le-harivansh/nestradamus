import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Types } from 'mongoose';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { UserService } from '@/_user/service/user.service';

import { Type } from '../_token/constant';
import { TokenService } from '../_token/service/token.service';
import { JwtHttpHeader } from '../constant';

export abstract class RequiresUserJwtFromHeader implements CanActivate {
  constructor(
    private readonly type: Type,
    private readonly httpHeader: JwtHttpHeader,
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly loggerService: WinstonLoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const jwt = request.header(this.httpHeader);

    if (!jwt) {
      this.loggerService.log('Http header not present on the request', {
        type: this.type,
        header: this.httpHeader,
      });

      throw new UnauthorizedException();
    }

    let authenticatedUserId: string;

    try {
      authenticatedUserId = this.tokenService.validateAuthenticationJwt(
        this.type,
        jwt,
      ).id;
    } catch (error) {
      this.loggerService.log('Invalid JWT', {
        type: this.type,
        jwt,
        error: (error as Error)?.message,
      });

      throw new UnauthorizedException();
    }

    try {
      request.user = await this.userService.findOne(
        new Types.ObjectId(authenticatedUserId),
      );
    } catch {
      this.loggerService.log('Could not retrieve user from database', {
        type: this.type,
        jwt,
        id: authenticatedUserId,
      });

      throw new UnauthorizedException();
    }

    this.loggerService.log('JWT validated', {
      type: this.type,
      jwt,
      user: request.user,
    });

    return true;
  }
}
