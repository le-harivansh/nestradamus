import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Connection } from 'mongoose';

import { ConnectionName } from '@/_application/_database/constant';

import { Constructor, PropertiesOfInstanceOfConstructor } from '../../helper';

export const enum ExistenceConstraint {
  SHOULD_EXIST = 'document-with-matching-property-should-exist',
  SHOULD_NOT_EXIST = 'document-with-matching-property-should-not-exist',
}

@Injectable()
@ValidatorConstraint({ async: true })
export class ExistenceValidatorConstraint<T extends Constructor<unknown>>
  implements ValidatorConstraintInterface
{
  private readonly connections = new Map<ConnectionName, Connection>();

  constructor(@InjectConnection() defaultConnection: Connection) {
    /**
     * If there are multiple connections in the application, they can be added
     * to the map here.
     * Just inject them into the constructor using parameter injection, then add
     * them to the `connections` map.
     */
    this.connections.set(ConnectionName.DEFAULT, defaultConnection);
  }

  async validate(
    value: unknown,
    { constraints }: ValidationArguments,
  ): Promise<boolean> {
    const [
      modelClass,
      fieldUnderValidation,
      connectionName,
      existenceConstraint,
    ] = constraints as [
      T,
      PropertiesOfInstanceOfConstructor<T>,
      ConnectionName,
      ExistenceConstraint,
    ];

    const connection = this.connections.get(connectionName);

    if (connection === undefined) {
      throw new InternalServerErrorException(
        `Could not get the connection: '${connectionName}'.`,
      );
    }

    const model = connection.model(modelClass.name);

    if (model.schema.path(fieldUnderValidation) === undefined) {
      throw new InternalServerErrorException(
        `The field: '${fieldUnderValidation}' does not exist on the schema: '${modelClass.name}'.`,
      );
    }

    const documentCount = await model
      .find({ [fieldUnderValidation]: value })
      .count()
      .exec();

    switch (existenceConstraint) {
      case ExistenceConstraint.SHOULD_EXIST:
        return documentCount !== 0;
      case ExistenceConstraint.SHOULD_NOT_EXIST:
        return documentCount === 0;
      default:
        throw new InternalServerErrorException(
          `Invalid ExistenceConstraint: '${existenceConstraint}' provided.`,
        );
    }
  }

  defaultMessage({ constraints, value }: ValidationArguments): string {
    const [, fieldUnderValidation, , existenceConstraint] = constraints as [
      T,
      PropertiesOfInstanceOfConstructor<T>,
      ConnectionName,
      ExistenceConstraint,
    ];

    switch (existenceConstraint) {
      case ExistenceConstraint.SHOULD_EXIST:
        return `The ${fieldUnderValidation} '${value}' does not exist.`;
      case ExistenceConstraint.SHOULD_NOT_EXIST:
        return `The ${fieldUnderValidation} '${value}' already exists.`;
      default:
        throw new InternalServerErrorException(
          `Invalid ExistenceConstraint: '${existenceConstraint}' provided.`,
        );
    }
  }
}
