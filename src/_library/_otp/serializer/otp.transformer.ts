import { Exclude, Expose, Transform } from 'class-transformer';

import { Otp } from '../schema/otp.schema';
import { OtpTypeName } from '../type';

export class OtpTransformer extends Otp {
  @Expose()
  @Transform(({ obj: user }) => user._id.toString(), {
    toClassOnly: true,
  })
  readonly id!: string;

  @Expose()
  declare readonly type: OtpTypeName;

  @Expose()
  declare readonly destination: string;

  @Expose()
  declare readonly expiresAt: Date;

  @Exclude()
  declare readonly password: string;
}
