import { registerDecorator, ValidationOptions } from 'class-validator';

import { PermissionValidatorConstraint } from './constraint/permission.validator-constraint';

export function IsPermission(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      ...(validationOptions ? { options: validationOptions } : {}),
      validator: PermissionValidatorConstraint,
    });
  };
}
