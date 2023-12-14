import { Injectable } from '@nestjs/common';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { UserService } from '@/_user/service/user.service';

import { Type } from '../_token/constant';
import { TokenService } from '../_token/service/token.service';
import { JwtHttpHeader } from '../constant';
import { RequiresUserJwtFromHeader } from './requires-user-jwt-from-header.guard';

@Injectable()
export class RequiresUserRefreshToken extends RequiresUserJwtFromHeader {
  static readonly JWT_TYPE = Type.USER_REFRESH_TOKEN;
  static readonly HTTP_HEADER = JwtHttpHeader.USER_REFRESH_TOKEN;

  constructor(
    userService: UserService,
    tokenService: TokenService,
    loggerService: WinstonLoggerService,
  ) {
    loggerService.setContext(RequiresUserRefreshToken.name);

    super(
      RequiresUserRefreshToken.JWT_TYPE,
      RequiresUserRefreshToken.HTTP_HEADER,
      userService,
      tokenService,
      loggerService,
    );
  }
}
