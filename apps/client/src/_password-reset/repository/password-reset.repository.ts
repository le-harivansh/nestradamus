import { Inject, InternalServerErrorException } from '@nestjs/common';
import { Collection, Db, ObjectId, WithId } from 'mongodb';

import { DATABASE } from '@library/database';

import { User } from '../../_user/entity/user.entity';
import { UserSchema } from '../../_user/entity/user.schema';
import { PasswordReset } from '../entity/password-reset.entity';
import { PasswordResetSchema } from '../entity/password-reset.schema';

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

  async create(
    passwordResetData: PasswordReset,
  ): Promise<WithId<PasswordReset>> {
    const { acknowledged, insertedId: newPasswordResetId } =
      await this.collection.insertOne(passwordResetData);

    if (!acknowledged) {
      throw new InternalServerErrorException(
        `Could not acknowledge the creation of the 'password-reset' record with data: ${JSON.stringify(passwordResetData)}.`,
      );
    }

    return {
      _id: newPasswordResetId,
      ...passwordResetData,
    };
  }

  update(id: ObjectId, passwordResetData: Partial<PasswordReset>) {
    return this.collection.findOneAndUpdate(
      { _id: id },
      { $set: passwordResetData },
      { returnDocument: 'after' },
    );
  }

  async delete(id: ObjectId) {
    const { acknowledged, deletedCount } = await this.collection.deleteOne({
      _id: id,
    });

    if (!acknowledged) {
      throw new InternalServerErrorException(
        `Could not delete 'password-reset' with id: '${id}'.`,
      );
    }

    if (deletedCount !== 1) {
      throw new InternalServerErrorException(
        `An unexpected number of 'password-reset' records (${deletedCount}) were deleted [id: '${id}'].`,
      );
    }
  }
}
