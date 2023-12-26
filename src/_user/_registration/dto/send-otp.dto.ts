import { IsEmail } from 'class-validator';

import ShouldNotExist from '@/_library/validator/should-not-exist.validator';
import { User } from '@/_user/_user/schema/user.schema';

export class SendOtpDto {
  @IsEmail(undefined, { message: 'A valid email address should be provided.' })
  @ShouldNotExist(User, 'username')
  readonly destination!: string;
}
