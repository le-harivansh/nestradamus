import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';

import { DATABASE } from '@library/database';

import { User } from './user.entity';

@Injectable()
export class UserSchema {
  public static readonly collectionName = 'users';

  private static readonly validator = {
    $jsonSchema: {
      bsonType: 'object',
      required: ['firstName', 'lastName', 'email', 'password', 'permissions'],
      properties: {
        firstName: {
          bsonType: 'string',
          description: 'The first-name of the user is required.',
        },
        lastName: {
          bsonType: 'string',
          description: 'The last-name of the user is required.',
        },
        email: {
          bsonType: 'string',
          description: 'The email address of the user is required.',
        },
        password: {
          bsonType: 'string',
          description: 'The password of the user is required.',
        },
        permissions: {
          bsonType: 'array',
          description: 'The permissions field is required.',
          items: {
            bsonType: 'string',
          },
        },
      },
    },
  } as const;

  constructor(@Inject(DATABASE) private readonly database: Db) {}

  async initialize() {
    const collection = await this.database.createCollection<User>(
      UserSchema.collectionName,
    );

    await collection.createIndex({ email: 1 }, { unique: true });

    await this.database.command({
      collMod: UserSchema.collectionName,
      validator: UserSchema.validator,
    });
  }
}
