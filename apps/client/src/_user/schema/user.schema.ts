import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Exclude, Transform } from 'class-transformer';
import { Db, ObjectId, WithId } from 'mongodb';

import { DATABASE } from '@library/database';

/**
 * Entity
 */
export class User {
  constructor(
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly password: string,
    public readonly permissions: string[] = [],
  ) {}
}

/**
 * Serializer
 */
export class SerializedUser {
  @Transform(({ value }): string => value.toString())
  public readonly _id!: ObjectId;

  public readonly firstName!: string;
  public readonly lastName!: string;

  public readonly email!: string;

  @Exclude()
  public readonly password!: string;

  public readonly permissions!: string[];

  constructor(user: WithId<User>) {
    Object.assign(this, user);
  }
}

/**
 * Schema
 */
@Injectable()
export class UserSchema implements OnApplicationBootstrap {
  public static readonly collectionName = 'users';

  private static readonly validator = {
    $jsonSchema: {
      bsonType: 'object',
      required: ['firstName', 'lastName', 'email', 'password'],
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
          description: 'The permissions field should be an array.',
          items: {
            bsonType: 'string',
          },
        },
      },
    },
  } as const;

  constructor(@Inject(DATABASE) private readonly database: Db) {}

  async onApplicationBootstrap() {
    if (
      (
        await this.database
          .listCollections(
            { name: UserSchema.collectionName },
            { nameOnly: true },
          )
          .toArray()
      ).length === 0
    ) {
      const collection = await this.database.createCollection(
        UserSchema.collectionName,
      );

      await collection.createIndex({ email: 1 }, { unique: true });
    }

    await this.database.command({
      collMod: UserSchema.collectionName,
      validator: UserSchema.validator,
    });
  }
}
