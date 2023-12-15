import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';

import { Type } from '../_token/constant';
import { TokenService } from '../_token/service/token.service';
import { LoginDto } from '../dto/login.dto';
import { AuthenticationService } from '../service/authentication.service';

@Controller()
export class AuthenticationController {
  constructor(
    private readonly tokenService: TokenService,
    private readonly loggerService: WinstonLoggerService,
    private readonly authenticationService: AuthenticationService,
  ) {
    this.loggerService.setContext(AuthenticationController.name);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() { email, password }: LoginDto) {
    const authenticatedUser =
      await this.authenticationService.authenticateUserUsingCredentials(
        email,
        password,
      );

    this.loggerService.log('User authenticated', authenticatedUser);

    return {
      accessToken: this.tokenService.generateAuthenticationJwt(
        Type.USER_ACCESS_TOKEN,
        authenticatedUser,
      ),
      refreshToken: this.tokenService.generateAuthenticationJwt(
        Type.USER_REFRESH_TOKEN,
        authenticatedUser,
      ),
    };
  }
}
