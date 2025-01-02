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
import { setPermissions } from '../decorator/authorization.decorator';
import { PermissionContainer } from '../helper/permission-container';
import { UserCallbackService } from '../service/user-callback.service';
import {
  Permission,
  PermissionAndRequestParameterPair,
  PermissionConditionalObject,
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
    const requiredPermissions: Parameters<typeof setPermissions>[0][] =
      this.reflector
        .getAll(REQUIRED_PERMISSIONS, [
          context.getClass(),
          context.getHandler(),
        ])
        .filter((permission: typeof setPermissions | undefined) =>
          Boolean(permission),
        );

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

    return (
      await Promise.all(
        requiredPermissions.map((permission) =>
          this.isAllowed(
            permission,
            authenticatedUser,
            userPermissions,
            request.params,
          ),
        ),
      )
    ).every((result) => result);
  }

  private async isAllowed(
    requiredPermission: Parameters<typeof setPermissions>[0],
    authenticatedUser: unknown,
    userPermissions: Permission[],
    requestParameters: Request['params'],
  ): Promise<boolean> {
    let permission: Permission;
    let requestParameterMap: RequestParameterMap = {};

    if (AuthorizationGuard.permissionIsString(requiredPermission)) {
      permission = requiredPermission;
    } else if (
      AuthorizationGuard.permissionIsStringAndRequestParameterPair(
        requiredPermission,
      )
    ) {
      [permission, requestParameterMap] = requiredPermission;
    } else if (
      AuthorizationGuard.permissionIsConditionalObject(requiredPermission)
    ) {
      if ('and' in requiredPermission) {
        return (
          await Promise.all(
            requiredPermission.and.map((permission) =>
              this.isAllowed(
                permission,
                authenticatedUser,
                userPermissions,
                requestParameters,
              ),
            ),
          )
        ).every((result) => result);
      } else if ('or' in requiredPermission) {
        return (
          await Promise.all(
            requiredPermission.or.map((permission) =>
              this.isAllowed(
                permission,
                authenticatedUser,
                userPermissions,
                requestParameters,
              ),
            ),
          )
        ).some((result) => result);
      }
    }

    if (!userPermissions.includes(permission!)) {
      return false;
    }

    const permissionCallback = this.permissionContainer.getCallback(
      permission!,
    );
    const callbackParameters = AuthorizationGuard.buildCallbackParameterObject(
      requestParameters,
      requestParameterMap,
    );

    return await permissionCallback(authenticatedUser, callbackParameters);
  }

  private static buildCallbackParameterObject(
    requestParameters: Request['params'],
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

  private static permissionIsString(
    permission: Parameters<typeof setPermissions>[0],
  ): permission is Permission {
    return typeof permission === 'string';
  }

  private static permissionIsStringAndRequestParameterPair(
    permission: Parameters<typeof setPermissions>[0],
  ): permission is PermissionAndRequestParameterPair {
    return (
      permission instanceof Array &&
      permission.length === 2 &&
      typeof permission[0] === 'string' &&
      typeof permission[1] === 'object' &&
      permission[1] !== null
    );
  }

  private static permissionIsConditionalObject(
    permission: Parameters<typeof setPermissions>[0],
  ): permission is PermissionConditionalObject {
    return (
      typeof permission === 'object' &&
      permission !== null &&
      ('and' in permission || 'or' in permission)
    );
  }
}
