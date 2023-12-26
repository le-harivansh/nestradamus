import { IsEmail } from 'class-validator';

import ShouldExist from '@/_library/validator/should-exist.validator';
import { User } from '@/_user/_user/schema/user.schema';

export class SendOtpDto {
  @IsEmail(undefined, { message: 'A valid email address should be provided.' })
  @ShouldExist(User, 'username')
  readonly destination!: string;
}
