import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';

import { RequiresAccessToken } from '@/_authentication/guard/requires-access-token.guard';
import { RequiresRefreshToken } from '@/_authentication/guard/requires-refresh-token.guard';
import { User } from '@/_user/decorator/user.decorator';
import { RequestUser } from '@/_user/schema/user.schema';

import { TokenService } from '../service/token.service';

@Controller('token/refresh')
export class RefreshController {
  constructor(private readonly tokenService: TokenService) {}

  @Get('access-token')
  @UseGuards(RequiresRefreshToken)
  @HttpCode(HttpStatus.OK)
  regenerateAccessToken(@User() user: RequestUser) {
    return this.tokenService.generateAccessTokenFor(user);
  }

  @Get('refresh-token')
  @UseGuards(RequiresAccessToken)
  @HttpCode(HttpStatus.OK)
  regenerateRefreshToken(@User() user: RequestUser) {
    return this.tokenService.generateRefreshTokenFor(user);
  }
}
