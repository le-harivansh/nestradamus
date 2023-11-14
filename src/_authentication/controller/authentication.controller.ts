import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import { User } from '@/_user/decorator/user.decorator';
import { RequestUser } from '@/_user/schema/user.schema';

import { TokenService } from '../_token/service/token.service';
import { RequiresCredentials } from '../guard/requires-credentials.guard';

@Controller()
export class AuthenticationController {
  constructor(private readonly tokenService: TokenService) {}

  @Post('login')
  @UseGuards(RequiresCredentials)
  @HttpCode(HttpStatus.OK)
  login(@User() user: RequestUser) {
    return {
      accessToken: this.tokenService.generateAccessTokenFor(user),
      refreshToken: this.tokenService.generateRefreshTokenFor(user),
    };
  }
}
