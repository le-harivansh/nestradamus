import { Injectable } from '@nestjs/common';
import { HydratedDocument, Types } from 'mongoose';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { RequiresJwtFromHeader } from '@/_library/authentication/guard/requires-jwt-from-header.guard';
import type { RequestPropertyStoringAuthenticatedEntity } from '@/_library/authentication/type';
import { JwtType } from '@/_library/authentication/type';
import { User } from '@/_user/_user/schema/user.schema';
import { UserService } from '@/_user/_user/service/user.service';

import { TokenService } from '../_token/service/token.service';

@Injectable()
export class RequiresUserAccessToken extends RequiresJwtFromHeader<User> {
  static readonly JWT_TYPE: JwtType = 'access-token';
  static readonly HTTP_HEADER = 'user.access-token';
  static readonly REQUEST_PROPERTY_HOLDING_AUTHENTICATABLE_ENTITY: RequestPropertyStoringAuthenticatedEntity =
    'user';

  constructor(
    loggerService: WinstonLoggerService,
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {
    loggerService.setContext(RequiresUserAccessToken.name);

    super(
      RequiresUserAccessToken.JWT_TYPE,
      RequiresUserAccessToken.HTTP_HEADER,
      RequiresUserAccessToken.REQUEST_PROPERTY_HOLDING_AUTHENTICATABLE_ENTITY,
      loggerService,
    );
  }

  override getAuthenticatableEntity(
    id: Types.ObjectId,
  ): Promise<HydratedDocument<User>> {
    return this.userService.findOne(id);
  }

  override validateAuthenticationJwt(jwt: string): Types.ObjectId {
    const authenticatableEntityId = this.tokenService.validateAuthenticationJwt(
      this.type,
      jwt,
    ).id;

    return new Types.ObjectId(authenticatableEntityId);
  }
}
