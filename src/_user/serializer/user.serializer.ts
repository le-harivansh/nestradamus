import { Exclude, Expose, Transform } from 'class-transformer';

import { User as UserModel } from '../schema/user.schema';

export class User extends UserModel {
  @Expose()
  @Transform(({ obj: userDocument }) => userDocument._id.toString(), {
    toClassOnly: true,
  })
  readonly id!: string;

  @Expose()
  declare readonly email: string;

  @Exclude()
  declare readonly password: string;
}
