import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { HydratedDocument } from 'mongoose';

import { AuthenticatedAdministrator } from '@/_administration/_administrator/decorator/administrator.decorator';
import { Administrator } from '@/_administration/_administrator/schema/administrator.schema';
import { HOST } from '@/_administration/constant';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';

import { RequiresAdministratorAccessToken } from '../../guard/requires-administrator-access-token.guard';
import { RequiresAdministratorRefreshToken } from '../../guard/requires-administrator-refresh-token.guard';
import { TokenService } from '../service/token.service';

@Controller({ host: HOST, path: 'token/refresh' })
export class RefreshController {
  constructor(
    private readonly tokenService: TokenService,
    private readonly loggerService: WinstonLoggerService,
  ) {
    this.loggerService.setContext(`${RefreshController.name}[Administrator]`);
  }

  @Get('access-token')
  @UseGuards(RequiresAdministratorRefreshToken)
  @HttpCode(HttpStatus.OK)
  regenerateAccessToken(
    @AuthenticatedAdministrator()
    administrator: HydratedDocument<Administrator>,
  ) {
    this.loggerService.log('Request to generate access-token', administrator);

    return this.tokenService.generateAuthenticationJwt(
      'access-token',
      administrator,
    );
  }

  @Get('refresh-token')
  @UseGuards(RequiresAdministratorAccessToken)
  @HttpCode(HttpStatus.OK)
  regenerateRefreshToken(
    @AuthenticatedAdministrator()
    administrator: HydratedDocument<Administrator>,
  ) {
    this.loggerService.log('Request to generate refresh-token', administrator);

    return this.tokenService.generateAuthenticationJwt(
      'refresh-token',
      administrator,
    );
  }
}
