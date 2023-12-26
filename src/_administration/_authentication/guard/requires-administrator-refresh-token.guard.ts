import { Injectable } from '@nestjs/common';
import { HydratedDocument, Types } from 'mongoose';

import { Administrator } from '@/_administration/_administrator/schema/administrator.schema';
import { AdministratorService } from '@/_administration/_administrator/service/administrator.service';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { RequiresJwtFromHeader } from '@/_library/authentication/guard/requires-jwt-from-header.guard';
import type { RequestPropertyStoringAuthenticatedEntity } from '@/_library/authentication/type';
import { JwtType } from '@/_library/authentication/type';

import { TokenService } from '../_token/service/token.service';

@Injectable()
export class RequiresAdministratorRefreshToken extends RequiresJwtFromHeader<Administrator> {
  static readonly JWT_TYPE: JwtType = 'refresh-token';
  static readonly HTTP_HEADER = 'administrator.refresh-token';
  static readonly REQUEST_PROPERTY_HOLDING_AUTHENTICATABLE_ENTITY: RequestPropertyStoringAuthenticatedEntity =
    'administrator';

  constructor(
    loggerService: WinstonLoggerService,
    private readonly administratorService: AdministratorService,
    private readonly tokenService: TokenService,
  ) {
    loggerService.setContext(RequiresAdministratorRefreshToken.name);

    super(
      RequiresAdministratorRefreshToken.JWT_TYPE,
      RequiresAdministratorRefreshToken.HTTP_HEADER,
      RequiresAdministratorRefreshToken.REQUEST_PROPERTY_HOLDING_AUTHENTICATABLE_ENTITY,
      loggerService,
    );
  }

  override getAuthenticatableEntity(
    id: Types.ObjectId,
  ): Promise<HydratedDocument<Administrator>> {
    return this.administratorService.findOne(id);
  }

  override validateAuthenticationJwt(jwt: string): Types.ObjectId {
    const authenticatableEntityId = this.tokenService.validateAuthenticationJwt(
      this.type,
      jwt,
    ).id;

    return new Types.ObjectId(authenticatableEntityId);
  }
}
