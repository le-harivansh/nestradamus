import { Exclude, Transform } from 'class-transformer';
import { ObjectId, WithId } from 'mongodb';

import { User } from './user.entity';

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
