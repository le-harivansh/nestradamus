import { Injectable } from '@nestjs/common';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { UserService } from '@/_user/service/user.service';

import { TokenService } from '../_token/service/token.service';
import { Guard, JwtType, TokenHttpHeader } from '../constant';
import { JwtStrategy } from './jwt.strategy';

@Injectable()
export class RefreshTokenStrategy extends JwtStrategy(Guard.REFRESH_TOKEN) {
  constructor(
    tokenService: TokenService,
    loggerService: WinstonLoggerService,
    userService: UserService,
  ) {
    super(
      JwtType.REFRESH_TOKEN,
      TokenHttpHeader.REFRESH_TOKEN,
      tokenService,
      loggerService,
      userService,
    );
  }
}
