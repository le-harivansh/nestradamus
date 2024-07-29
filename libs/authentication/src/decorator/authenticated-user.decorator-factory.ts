import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request } from 'express';

export function getAuthenticatedUserFromPropertyInRequest(
  requestPropertyHoldingAuthenticatedUser: string,
) {
  return (property: string | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>();
    const authenticatedUser = (request as unknown as Record<string, unknown>)[
      requestPropertyHoldingAuthenticatedUser
    ];

    if (authenticatedUser === undefined) {
      throw new InternalServerErrorException(
        `The request property '${requestPropertyHoldingAuthenticatedUser}' is undefined.`,
      );
    }

    return property
      ? (authenticatedUser as Record<string, unknown> | null)?.[property]
      : authenticatedUser;
  };
}

export function AuthenticatedUserDecoratorFactory(
  requestPropertyHoldingAuthenticatedUser: string,
) {
  return createParamDecorator(
    getAuthenticatedUserFromPropertyInRequest(
      requestPropertyHoldingAuthenticatedUser,
    ),
  );
}
