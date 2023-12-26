import {
  CanActivate,
  ExecutionContext,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { HydratedDocument, Types } from 'mongoose';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';

import { Authenticatable } from '../schema/authenticatable.interface';
import type { RequestPropertyStoringAuthenticatedEntity } from '../type';
import { JwtType } from '../type';

export abstract class RequiresJwtFromHeader<T extends Authenticatable>
  implements CanActivate
{
  constructor(
    protected readonly type: JwtType,
    private readonly httpHeader: string,
    private readonly requestPropertyHoldingAuthenticatableEntity: RequestPropertyStoringAuthenticatedEntity,
    private readonly loggerService: WinstonLoggerService,
  ) {}

  /**
   * This method should retrieve the authenticatable entity from the database.
   *
   * This method is expected to throw a `NotFoundException` if the
   * authenticatable entity cannot be found.
   */
  abstract getAuthenticatableEntity(
    id: Types.ObjectId,
  ): Promise<HydratedDocument<T>>;

  /**
   * This method should validate the JWT, and return the id of the
   * authenticatable entity.
   *
   * This method is expected to throw an error if the JWT validation fails.
   */
  abstract validateAuthenticationJwt(jwt: string): Types.ObjectId;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const jwt = request.header(this.httpHeader);

    if (!jwt) {
      this.loggerService.log('Http header not present on the request', {
        type: this.type,
        header: this.httpHeader,
      });

      throw new UnauthorizedException();
    }

    let authenticatableEntityId: Types.ObjectId;

    try {
      authenticatableEntityId = this.validateAuthenticationJwt(jwt);
    } catch (error) {
      this.loggerService.log('Invalid JWT', {
        type: this.type,
        jwt,
        error: (error as Error)?.message,
      });

      throw new UnauthorizedException();
    }

    try {
      request[this.requestPropertyHoldingAuthenticatableEntity] =
        await this.getAuthenticatableEntity(authenticatableEntityId);
    } catch (error) {
      this.loggerService.log('Could not retrieve user from database', {
        type: this.type,
        jwt,
        id: authenticatableEntityId,
        error: (error as Error)?.message,
      });

      if (!(error instanceof NotFoundException)) {
        throw error;
      }

      throw new UnauthorizedException();
    }

    this.loggerService.log('JWT validated', {
      type: this.type,
      jwt,
      authenticatedEntity:
        request[this.requestPropertyHoldingAuthenticatableEntity],
    });

    return true;
  }
}
