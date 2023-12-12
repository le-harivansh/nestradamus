import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { User } from '@/_user/decorator/user.decorator';
import { UserDocument } from '@/_user/schema/user.schema';

import { TokenService } from '../_token/service/token.service';
import { RequiresCredentials } from '../guard/requires-credentials.guard';

@Controller()
export class AuthenticationController {
  constructor(
    private readonly tokenService: TokenService,
    private readonly loggerService: WinstonLoggerService,
  ) {
    this.loggerService.setContext(AuthenticationController.name);
  }

  @Post('login')
  @UseGuards(RequiresCredentials)
  @HttpCode(HttpStatus.OK)
  login(@User() user: UserDocument) {
    this.loggerService.log('User logged in', user);

    return {
      accessToken: this.tokenService.generateAccessTokenFor(user),
      refreshToken: this.tokenService.generateRefreshTokenFor(user),
    };
  }
}
