import { Inject, Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { AUTHORIZATION_PERMISSIONS_CONTAINER } from '../../constant';
import { PermissionContainer } from '../../helper/permission-container';

@ValidatorConstraint()
@Injectable()
export class PermissionValidatorConstraint
  implements ValidatorConstraintInterface
{
  constructor(
    @Inject(AUTHORIZATION_PERMISSIONS_CONTAINER)
    private readonly authorizationPermissionsContainer: PermissionContainer,
  ) {}

  validate(permission: string): boolean {
    const allowedPermissions =
      this.authorizationPermissionsContainer.getPermissions();

    return allowedPermissions.includes(permission);
  }

  defaultMessage({ value: permission }: ValidationArguments): string {
    return `Invalid permission '${permission}' provided.`;
  }
}
