import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { HydratedDocument } from 'mongoose';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { RequiresUserAccessToken } from '@/_user/_authentication/guard/requires-user-access-token.guard';
import { RequiresUserRefreshToken } from '@/_user/_authentication/guard/requires-user-refresh-token.guard';
import { AuthenticatedUser } from '@/_user/_user/decorator/user.decorator';
import { User } from '@/_user/_user/schema/user.schema';

import { TokenService } from '../service/token.service';

@Controller('token/refresh')
export class RefreshController {
  constructor(
    private readonly tokenService: TokenService,
    private readonly loggerService: WinstonLoggerService,
  ) {
    this.loggerService.setContext(`${RefreshController.name}[${User.name}]`);
  }

  @Get('access-token')
  @UseGuards(RequiresUserRefreshToken)
  @HttpCode(HttpStatus.OK)
  regenerateAccessToken(@AuthenticatedUser() user: HydratedDocument<User>) {
    this.loggerService.log('Request to generate access-token', user);

    return this.tokenService.generateAuthenticationJwt('access-token', user);
  }

  @Get('refresh-token')
  @UseGuards(RequiresUserAccessToken)
  @HttpCode(HttpStatus.OK)
  regenerateRefreshToken(@AuthenticatedUser() user: HydratedDocument<User>) {
    this.loggerService.log('Request to generate refresh-token', user);

    return this.tokenService.generateAuthenticationJwt('refresh-token', user);
  }
}
