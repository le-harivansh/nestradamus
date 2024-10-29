import { Inject } from '@nestjs/common';
import { Collection, Db, ObjectId, WithId } from 'mongodb';

import { DATABASE } from '@library/database';

import { User, UserSchema } from '../../_user/schema/user.schema';
import {
  PasswordReset,
  PasswordResetSchema,
} from '../schema/password-reset.schema';

export class PasswordResetRepository {
  private readonly collection: Collection<PasswordReset>;

  constructor(@Inject(DATABASE) database: Db) {
    this.collection = database.collection<PasswordReset>(
      PasswordResetSchema.collectionName,
    );
  }

  async findById(id: ObjectId) {
    return (
      (
        await this.collection
          .aggregate<
            WithId<
              Omit<PasswordReset, 'userId'> & {
                user: Pick<
                  WithId<User>,
                  '_id' | 'firstName' | 'lastName' | 'email'
                >;
              }
            >
          >([
            { $match: { _id: id } },
            {
              $lookup: {
                from: UserSchema.collectionName,
                localField: 'userId',
                foreignField: '_id',
                as: 'user',
                pipeline: [
                  {
                    $project: {
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                ],
              },
            },
            { $set: { user: { $first: '$user' } } },
            { $unset: ['userId'] },
          ])
          .toArray()
      )[0] ?? null
    );
  }

  findByUserId(userId: ObjectId) {
    return this.collection.findOne({ userId });
  }

  create(passwordResetData: PasswordReset) {
    return this.collection.insertOne(passwordResetData);
  }

  update(id: ObjectId, passwordResetData: Partial<PasswordReset>) {
    return this.collection.updateOne({ _id: id }, { $set: passwordResetData });
  }

  delete(id: ObjectId) {
    return this.collection.deleteOne({ _id: id });
  }
}
