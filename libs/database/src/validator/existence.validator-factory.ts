import { InternalServerErrorException, Type } from '@nestjs/common';
import { registerDecorator, ValidationOptions } from 'class-validator';
import { WithId } from 'mongodb';

import { ExistenceValidatorConstraint } from './constraint/existence.validator-constraint';

export function existenceValidatorFactory<T extends Type>(
  entityCollectionMap: Map<T, string>,
  validatesExistence: boolean,
) {
  return function (
    entity: T,
    field?: keyof WithId<T['prototype']> | undefined,
    validationOptions?: ValidationOptions | undefined,
  ) {
    if (!entityCollectionMap.has(entity)) {
      throw new InternalServerErrorException(
        `The entity '${entity.name}' does not exist in the provided entityCollectionMap.`,
      );
    }

    return function (object: object, propertyName: string) {
      const collectionName = entityCollectionMap.get(entity)!;
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
