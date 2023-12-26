import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';

import { TokenService } from '../_token/service/token.service';
import { LoginDto } from '../dto/login.dto';
import { AuthenticationService } from '../service/authentication.service';

@Controller('login')
export class AuthenticationController {
  constructor(
    private readonly tokenService: TokenService,
    private readonly loggerService: WinstonLoggerService,
    private readonly authenticationService: AuthenticationService,
  ) {
    this.loggerService.setContext(AuthenticationController.name);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async login(@Body() { email: username, password }: LoginDto) {
    const authenticatedUser =
      await this.authenticationService.authenticateUsingCredentials(
        username,
        password,
      );

    this.loggerService.log('User authenticated', authenticatedUser);

    return {
      accessToken: this.tokenService.generateAuthenticationJwt(
        'access-token',
        authenticatedUser,
      ),
      refreshToken: this.tokenService.generateAuthenticationJwt(
        'refresh-token',
        authenticatedUser,
      ),
    };
  }
}
