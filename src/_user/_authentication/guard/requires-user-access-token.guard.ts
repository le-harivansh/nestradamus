import { Injectable } from '@nestjs/common';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { UserService } from '@/_user/_user/service/user.service';

import { Type } from '../_token/constant';
import { TokenService } from '../_token/service/token.service';
import { JwtHttpHeader } from '../constant';
import { RequiresUserJwtFromHeader } from './requires-user-jwt-from-header.guard';

@Injectable()
export class RequiresUserAccessToken extends RequiresUserJwtFromHeader {
  static readonly JWT_TYPE = Type.USER_ACCESS_TOKEN;
  static readonly HTTP_HEADER = JwtHttpHeader.USER_ACCESS_TOKEN;

  constructor(
    userService: UserService,
    tokenService: TokenService,
    loggerService: WinstonLoggerService,
  ) {
    loggerService.setContext(RequiresUserAccessToken.name);

    super(
      RequiresUserAccessToken.JWT_TYPE,
      RequiresUserAccessToken.HTTP_HEADER,
      userService,
      tokenService,
      loggerService,
    );
  }
}
