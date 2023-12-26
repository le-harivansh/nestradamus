import { Exclude, Expose, Transform } from 'class-transformer';

import { User } from '../schema/user.schema';

export class UserTransformer extends User {
  @Expose()
  @Transform(({ obj: user }) => user._id.toString(), {
    toClassOnly: true,
  })
  readonly id!: string;

  @Expose()
  declare readonly username: string;

  @Exclude()
  declare readonly password: string;
}
