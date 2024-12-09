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
  modelCollectionMap: Map<T, string>,
) {
  return function (model: T, field?: keyof WithId<T['prototype']> | undefined) {
    @Injectable()
    class RouteParameterResolverPipe implements PipeTransform {
      constructor(@Inject(DATABASE) readonly database: Db) {}

      async transform(
        value: string,
        { data: routeParameterKey }: ArgumentMetadata,
      ) {
        if (!modelCollectionMap.has(model)) {
          throw new InternalServerErrorException(
            `The model '${model.name}' does not exist in the provided modelCollectionMap.`,
          );
        }

        const collectionName = modelCollectionMap.get(model)!;

        const rawFieldName = field ?? routeParameterKey;

        if (rawFieldName === undefined) {
          throw new InternalServerErrorException(
            "The raw field-name to query resolved to 'undefined'.",
          );
        }

        const fieldName = rawFieldName === 'id' ? '_id' : rawFieldName;
        const fieldValue = fieldName === '_id' ? new ObjectId(value) : value;

        const resolvedModel = await this.database
          .collection(collectionName)
          .findOne({ [fieldName]: fieldValue });

        if (resolvedModel === null) {
          throw new NotFoundException(
            `Could not find the model '${model.name}' with the field '${String(fieldName)}' holding value '${fieldValue}'.`,
          );
        }

        return resolvedModel;
      }
    }

    return RouteParameterResolverPipe;
  };
}
