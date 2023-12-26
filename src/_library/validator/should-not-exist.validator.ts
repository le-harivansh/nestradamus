import { ValidationOptions, registerDecorator } from 'class-validator';

import { ConnectionName } from '@/_application/_database/constant';

import { ExistenceConstraint } from '../constant';
import { Constructor, PropertiesOfInstanceOfConstructor } from '../type';
import { ExistenceValidatorConstraint } from './constraint/existence.constraint';

export default function ShouldNotExist<T extends Constructor<unknown>>(
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
        ExistenceConstraint.SHOULD_NOT_EXIST,
      ],
      options: validationOptions,
      validator: ExistenceValidatorConstraint<T>,
    });
}
