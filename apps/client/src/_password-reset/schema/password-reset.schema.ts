import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Db, ObjectId } from 'mongodb';

import { DATABASE } from '@library/database';

import { ConfigurationService } from '../../_configuration/service/configuration.service';

/**
 * Model
 */
export class PasswordReset {
  constructor(
    public readonly userId: ObjectId,
    public readonly createdAt: Date,
  ) {}
}

/**
 * Schema
 */
@Injectable()
export class PasswordResetSchema implements OnApplicationBootstrap {
  public static readonly collectionName = 'password-resets';

  private static readonly validator = {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'createdAt'],
      properties: {
        userId: {
          bsonType: 'objectId',
          description:
            'The id of the user - for whom the password-reset was requested - is required.',
        },
        createdAt: {
          bsonType: 'date',
          description:
            'The date on which the record was created - is required.',
        },
      },
    },
  } as const;

  constructor(
    @Inject(DATABASE) private readonly database: Db,
    private readonly configurationService: ConfigurationService,
  ) {}

  async onApplicationBootstrap() {
    if (
      (
        await this.database
          .listCollections(
            { name: PasswordResetSchema.collectionName },
            { nameOnly: true },
          )
          .toArray()
      ).length === 0
    ) {
      const collection = await this.database.createCollection(
        PasswordResetSchema.collectionName,
      );

      await collection.createIndex({ userId: 1 }, { unique: true });

      const expireAfterSeconds = this.configurationService.getOrThrow(
        'password-reset.validForSeconds',
      );

      await collection.createIndex({ createdAt: 1 }, { expireAfterSeconds });
    }

    await this.database.command({
      collMod: PasswordResetSchema.collectionName,
      validator: PasswordResetSchema.validator,
    });
  }
}