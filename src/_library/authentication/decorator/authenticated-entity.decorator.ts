import {
  ExecutionContext,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { HydratedDocument } from 'mongoose';

import { Authenticatable } from '../schema/authenticatable.interface';
import type { RequestPropertyStoringAuthenticatedEntity } from '../type';

export function getAuthenticatedEntityFromRequest<
  AuthenticatedEntity extends Authenticatable,
>(
  requestPropertyStoringAuthenticatedEntity: RequestPropertyStoringAuthenticatedEntity,
) {
  return (
    propertyToExtractFromAuthenticatedEntity:
      | keyof AuthenticatedEntity
      | undefined,
    context: ExecutionContext,
  ):
    | HydratedDocument<AuthenticatedEntity>
    | AuthenticatedEntity[keyof AuthenticatedEntity] => {
    const request = context.switchToHttp().getRequest();

    if (!(requestPropertyStoringAuthenticatedEntity in request)) {
      throw new InternalServerErrorException(
        `The request object does not have the property: '${String(
          requestPropertyStoringAuthenticatedEntity,
        )}'.`,
      );
    }

    const authenticatedEntity = request[
      requestPropertyStoringAuthenticatedEntity
    ] as HydratedDocument<AuthenticatedEntity>;

    if (!authenticatedEntity) {
      throw new UnauthorizedException();
    }

    if (
      propertyToExtractFromAuthenticatedEntity &&
      authenticatedEntity.schema.path(
        propertyToExtractFromAuthenticatedEntity,
      ) === undefined
    ) {
      throw new InternalServerErrorException(
        `Property '${String(
          propertyToExtractFromAuthenticatedEntity,
        )}' does not exist on the authenticated entity in the current request.`,
      );
    }

    return propertyToExtractFromAuthenticatedEntity
      ? authenticatedEntity.get(propertyToExtractFromAuthenticatedEntity)
      : authenticatedEntity;
  };
}
