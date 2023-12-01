import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
import { Connection } from 'mongoose';

import { ConnectionName } from '@/_application/_database/constant';

import { Constructor, PropertiesOfInstanceOfConstructor } from '../helper';

@Injectable()
@ValidatorConstraint({ async: true })
export class IsUniqueValidatorConstraint<T extends Constructor<unknown>>
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
    const [modelClass, fieldUnderValidation, connectionName] = constraints as [
      T,
      PropertiesOfInstanceOfConstructor<T>,
      ConnectionName,
    ];

    const connection = this.connections.get(connectionName);

    if (connection === undefined) {
      throw new InternalServerErrorException(
        `Could not get the connection '${connectionName}'.`,
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

    return documentCount === 0;
  }

  defaultMessage({ constraints, value }: ValidationArguments): string {
    const fieldUnderValidation = constraints[1];

    return `The ${fieldUnderValidation} '${value}' already exists.`;
  }
}

export default function IsUnique<T extends Constructor<unknown>>(
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
      ],
      options: validationOptions,
      validator: IsUniqueValidatorConstraint<T>,
    });
}
