import { Exclude, Expose, Transform } from 'class-transformer';

import { Otp } from '../schema/otp.schema';

export class OtpTransformer extends Otp {
  @Expose()
  @Transform(({ obj: otp }) => otp._id.toString(), {
    toClassOnly: true,
  })
  readonly id!: string;

  @Expose()
  declare readonly type: string;

  @Expose()
  declare readonly destination: string;

  @Expose()
  declare readonly expiresAt: Date;

  @Exclude()
  declare readonly password: string;
}
