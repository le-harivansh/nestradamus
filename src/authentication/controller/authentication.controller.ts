import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import { User } from '../../user/decorator/user.decorator';
import { RequestUser } from '../../user/schema/user.schema';
import { RequiresCredentials } from '../guard/requires-credentials.guard';
import { TokenService } from '../token/token.service';

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
