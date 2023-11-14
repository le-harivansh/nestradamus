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

import { ConnectionName } from '@/_application/_database/helper';

@Injectable()
@ValidatorConstraint({ async: true })
export class IsUniqueValidatorConstraint
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
    const [modelName, fieldUnderValidation, connectionName] = constraints as [
      string,
      string,
      ConnectionName,
    ];

    const connection = this.connections.get(connectionName);

    if (connection === undefined) {
      throw new InternalServerErrorException(
        `Could not get the connection '${connectionName}'.`,
      );
    }

    const documentCount = await connection
      .model(modelName)
      .find({ [fieldUnderValidation]: value })
      .count()
      .exec();

    return documentCount === 0;
  }

  defaultMessage({ property, value }: ValidationArguments): string {
    return `The ${property} '${value}' already exists.`;
  }
}

export default function IsUnique(
  modelName: string,
  fieldUnderValidation: string | undefined = undefined,
  connectionName: ConnectionName = ConnectionName.DEFAULT,
  validationOptions?: ValidationOptions,
) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      target: object.constructor,
      propertyName,
      async: true,
      constraints: [
        modelName,
        fieldUnderValidation ?? propertyName,
        connectionName,
      ],
      options: validationOptions,
      validator: IsUniqueValidatorConstraint,
    });
}
