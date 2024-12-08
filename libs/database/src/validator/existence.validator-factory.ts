import { InternalServerErrorException, Type } from '@nestjs/common';
import { registerDecorator, ValidationOptions } from 'class-validator';

import { ExistenceValidatorConstraint } from './constraint/existence.validator-constraint';

export function existenceValidatorFactory<T extends Type>(
  modelCollectionMap: Map<T, string>,
  validatesExistence: boolean,
) {
  return function (
    collection: T,
    fieldName?: keyof T['prototype'] | undefined,
    validationOptions?: ValidationOptions | undefined,
  ) {
    if (!modelCollectionMap.has(collection)) {
      throw new InternalServerErrorException(
        `The collection '${collection.name}' does not exist in the provided modelCollectionMap.`,
      );
    }

    return function (object: object, propertyName: string) {
      registerDecorator({
        target: object.constructor,
        propertyName,
        ...(validationOptions ? { options: validationOptions } : {}),
        constraints: [
          modelCollectionMap.get(collection),
          fieldName ?? propertyName,
          !validatesExistence,
        ],
        validator: ExistenceValidatorConstraint,
      });
    };
  };
}
