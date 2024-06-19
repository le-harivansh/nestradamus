import { Inject } from '@nestjs/common';
import { Db, ObjectId, WithId } from 'mongodb';

import { DATABASE } from '@application/database';

import { User, UserSchema } from '../schema/user.schema';

export class UserRepository {
  constructor(@Inject(DATABASE) private readonly database: Db) {}

  findById(id: string) {
    return this.database
      .collection<User>(UserSchema.collectionName)
      .findOne({ _id: new ObjectId(id) });
  }

  findByEmail(email: string): Promise<WithId<User> | null> {
    return this.database
      .collection<User>(UserSchema.collectionName)
      .findOne({ email });
  }

  create(userData: User) {
    return this.database
      .collection<User>(UserSchema.collectionName)
      .insertOne(userData);
  }
}
