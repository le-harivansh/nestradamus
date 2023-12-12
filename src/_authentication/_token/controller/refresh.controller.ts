import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { RequiresAccessToken } from '@/_authentication/guard/requires-access-token.guard';
import { RequiresRefreshToken } from '@/_authentication/guard/requires-refresh-token.guard';
import { User } from '@/_user/decorator/user.decorator';
import { UserDocument } from '@/_user/schema/user.schema';

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
  @UseGuards(RequiresRefreshToken)
  @HttpCode(HttpStatus.OK)
  regenerateAccessToken(@User() user: UserDocument) {
    this.loggerService.log('Request to generate access-token', user);

    return this.tokenService.generateAccessTokenFor(user);
  }

  @Get('refresh-token')
  @UseGuards(RequiresAccessToken)
  @HttpCode(HttpStatus.OK)
  regenerateRefreshToken(@User() user: UserDocument) {
    this.loggerService.log('Request to generate refresh-token', user);

    return this.tokenService.generateRefreshTokenFor(user);
  }
}
