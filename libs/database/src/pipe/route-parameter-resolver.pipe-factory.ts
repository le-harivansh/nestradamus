import {
  ArgumentMetadata,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  PipeTransform,
  Type,
} from '@nestjs/common';
import { Db, ObjectId, WithId } from 'mongodb';

import { DATABASE } from '../constant';

export function routeParameterResolverPipeFactory<T extends Type>(
  entityCollectionMap: Map<T, string>,
) {
  return function (
    entity: T,
    field?: keyof WithId<T['prototype']> | undefined,
  ) {
    @Injectable()
    class RouteParameterResolverPipe implements PipeTransform {
      constructor(@Inject(DATABASE) readonly database: Db) {}

      async transform(
        value: string,
        { data: routeParameterKey }: ArgumentMetadata,
      ) {
        if (!entityCollectionMap.has(entity)) {
          throw new InternalServerErrorException(
            `The entity '${entity.name}' does not exist in the provided entityCollectionMap.`,
          );
        }

        const collectionName = entityCollectionMap.get(entity)!;

        const rawFieldName = field ?? routeParameterKey;

        if (rawFieldName === undefined) {
          throw new InternalServerErrorException(
            "The raw field-name to query resolved to 'undefined'.",
          );
        }

        const fieldName = rawFieldName === 'id' ? '_id' : rawFieldName;
        const fieldValue = fieldName === '_id' ? new ObjectId(value) : value;

        const resolvedEntity = await this.database
          .collection(collectionName)
          .findOne({ [fieldName]: fieldValue });

        if (resolvedEntity === null) {
          throw new NotFoundException(
            `Could not find the entity '${entity.name}' with the field '${String(fieldName)}' holding value '${fieldValue}'.`,
          );
        }

        return resolvedEntity;
      }
    }

    return RouteParameterResolverPipe;
  };
}
