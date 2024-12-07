import { Inject, InternalServerErrorException } from '@nestjs/common';
import { Collection, Db, ObjectId, WithId } from 'mongodb';

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

  async create(userData: User): Promise<WithId<User>> {
    const { acknowledged, insertedId: newUserId } =
      await this.collection.insertOne(userData);

    if (!acknowledged) {
      throw new InternalServerErrorException(
        `Could not acknowledge the creation of the 'user' record with data: ${JSON.stringify({ userData })}`,
      );
    }

    return {
      _id: newUserId,
      ...userData,
    };
  }

  update(id: ObjectId, userData: Partial<User>) {
    return this.collection.findOneAndUpdate(
      { _id: id },
      { $set: userData },
      { returnDocument: 'after' },
    );
  }

  async delete(id: ObjectId) {
    const { acknowledged, deletedCount } = await this.collection.deleteOne({
      _id: id,
    });

    if (!acknowledged) {
      throw new InternalServerErrorException(
        `Could not delete 'user' with id: '${id}'.`,
      );
    }

    if (deletedCount !== 1) {
      throw new InternalServerErrorException(
        `An unexpected number of 'user' records (${deletedCount}) were deleted [id: '${id}'].`,
      );
    }
  }
}
