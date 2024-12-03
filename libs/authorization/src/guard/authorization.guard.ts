import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import {
  AUTHORIZATION_PERMISSIONS_CONTAINER,
  REQUIRED_PERMISSIONS,
} from '../constant';
import { PermissionContainer } from '../helper/permission-container';
import { UserCallbackService } from '../service/user-callback.service';
import {
  Permission,
  PermissionAndRequestParameterPair,
  RequestParameterMap,
} from '../type';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTHORIZATION_PERMISSIONS_CONTAINER)
    private readonly permissionContainer: PermissionContainer,

    private readonly userCallbackService: UserCallbackService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const requiredPermissions = this.reflector.getAllAndMerge<
      (Permission | PermissionAndRequestParameterPair)[]
    >(REQUIRED_PERMISSIONS, [context.getClass(), context.getHandler()]);

    if (requiredPermissions.length === 0) {
      /**
       * This guard is not applicable to routes without any permissions
       * attached to them.
       */
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    const authenticatedUser =
      await this.userCallbackService.retrieveFrom(request);
    const userPermissions =
      await this.userCallbackService.getPermissionsFor(authenticatedUser);

    for (const requiredPermissionOrPermissionTuple of requiredPermissions) {
      const [requiredPermission, requestParameterMap = {}] =
        typeof requiredPermissionOrPermissionTuple === 'string'
          ? [requiredPermissionOrPermissionTuple]
          : requiredPermissionOrPermissionTuple;

      if (!userPermissions.includes(requiredPermission)) {
        return false;
      }

      const permissionCallback =
        this.permissionContainer.getCallback(requiredPermission);
      const callbackParameters =
        AuthorizationGuard.buildCallbackParameterObjectFrom(
          request,
          requestParameterMap,
        );

      const permissionCallbackResult = await permissionCallback(
        authenticatedUser,
        callbackParameters,
      );

      if (!permissionCallbackResult) {
        return false;
      }
    }

    return true;
  }

  private static buildCallbackParameterObjectFrom(
    { params: requestParameters }: Request,
    permissionRequestParameterMap: RequestParameterMap,
  ) {
    const callbackParameterObject: Record<string, string> = {};

    for (const [callbackArgumentKey, requestParameterKey] of Object.entries(
      permissionRequestParameterMap,
    )) {
      if (!(requestParameterKey in requestParameters)) {
        throw new NotFoundException(
          `'${requestParameterKey}' not found amongst the request's parameters.`,
        );
      }

      callbackParameterObject[callbackArgumentKey] =
        requestParameters[requestParameterKey]!;
    }

    return callbackParameterObject;
  }
}
