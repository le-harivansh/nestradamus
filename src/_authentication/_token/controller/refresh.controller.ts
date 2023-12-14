import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { RequiresUserAccessToken } from '@/_authentication/guard/requires-user-access-token.guard';
import { RequiresUserRefreshToken } from '@/_authentication/guard/requires-user-refresh-token.guard';
import { User } from '@/_user/decorator/user.decorator';
import { UserDocument } from '@/_user/schema/user.schema';

import { Type } from '../constant';
import { TokenService } from '../service/token.service';

@Controller('token/refresh')
export class RefreshController {
  constructor(
    private readonly tokenService: TokenService,
    private readonly loggerService: WinstonLoggerService,
  ) {
    this.loggerService.setContext(RefreshController.name);
  }

  @Get('access-token')
  @UseGuards(RequiresUserRefreshToken)
  @HttpCode(HttpStatus.OK)
  regenerateAccessToken(@User() user: UserDocument) {
    this.loggerService.log('Request to generate access-token', user);

    return this.tokenService.generateAuthenticationJwt(
      Type.USER_ACCESS_TOKEN,
      user,
    );
  }

  @Get('refresh-token')
  @UseGuards(RequiresUserAccessToken)
  @HttpCode(HttpStatus.OK)
  regenerateRefreshToken(@User() user: UserDocument) {
    this.loggerService.log('Request to generate refresh-token', user);

    return this.tokenService.generateAuthenticationJwt(
      Type.USER_REFRESH_TOKEN,
      user,
    );
  }
}
