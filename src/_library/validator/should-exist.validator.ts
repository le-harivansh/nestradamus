import { ValidationOptions, registerDecorator } from 'class-validator';

import { ConnectionName } from '@/_application/_database/constant';

import { Constructor, PropertiesOfInstanceOfConstructor } from '../helper';
import {
  ExistenceConstraint,
  ExistenceValidatorConstraint,
} from './constraint/existence.constraint';

export default function ShouldExist<T extends Constructor<unknown>>(
  modelClass: T,
  fieldUnderValidation:
    | PropertiesOfInstanceOfConstructor<T>
    | undefined = undefined,
  connectionName: ConnectionName = ConnectionName.DEFAULT,
  validationOptions?: ValidationOptions,
): (object: object, propertyName: string) => void {
  return (object: object, propertyName: string) =>
    registerDecorator({
      target: object.constructor,
      propertyName,
      async: true,
      constraints: [
        modelClass,
        fieldUnderValidation ?? propertyName,
        connectionName,
        ExistenceConstraint.SHOULD_EXIST,
      ],
      options: validationOptions,
      validator: ExistenceValidatorConstraint<T>,
    });
}
