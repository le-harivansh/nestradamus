import { Exclude, Expose, Transform } from 'class-transformer';

import { Administrator } from '../schema/administrator.schema';

export class AdministratorTransformer extends Administrator {
  @Expose()
  @Transform(({ obj: administrator }) => administrator._id.toString(), {
    toClassOnly: true,
  })
  readonly id!: string;

  @Expose()
  declare readonly username: string;

  @Exclude()
  declare readonly password: string;
}
