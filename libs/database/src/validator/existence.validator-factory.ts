import { InternalServerErrorException, Type } from '@nestjs/common';
import { registerDecorator, ValidationOptions } from 'class-validator';
import { WithId } from 'mongodb';

import { ExistenceValidatorConstraint } from './constraint/existence.validator-constraint';

export function existenceValidatorFactory<T extends Type>(
  modelCollectionMap: Map<T, string>,
  validatesExistence: boolean,
) {
  return function (
    model: T,
    field?: keyof WithId<T['prototype']> | undefined,
    validationOptions?: ValidationOptions | undefined,
  ) {
    if (!modelCollectionMap.has(model)) {
      throw new InternalServerErrorException(
        `The model '${model.name}' does not exist in the provided modelCollectionMap.`,
      );
    }

    return function (object: object, propertyName: string) {
      const collectionName = modelCollectionMap.get(model)!;
      const fieldName = field ?? propertyName;
      const isInverse = !validatesExistence;

      registerDecorator({
        target: object.constructor,
        propertyName,
        ...(validationOptions ? { options: validationOptions } : {}),
        constraints: [collectionName, fieldName, isInverse],
        validator: ExistenceValidatorConstraint,
      });
    };
  };
}
