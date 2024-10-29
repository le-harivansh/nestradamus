import { Inject } from '@nestjs/common';
import { Collection, Db, ObjectId } from 'mongodb';

import { DATABASE } from '@library/database';

import { User, UserSchema } from '../schema/user.schema';

export class UserRepository {
  private readonly collection: Collection<User>;

  constructor(@Inject(DATABASE) database: Db) {
    this.collection = database.collection<User>(UserSchema.collectionName);
  }

  findById(id: ObjectId) {
    return this.collection.findOne({ _id: id });
  }

  findByEmail(email: string) {
    return this.collection.findOne({ email });
  }

  create(userData: User) {
    return this.collection.insertOne(userData);
  }

  update(id: ObjectId, userData: Partial<User>) {
    return this.collection.findOneAndUpdate(
      { _id: id },
      { $set: userData },
      { returnDocument: 'after' },
    );
  }
}
