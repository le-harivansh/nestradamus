import { IsEmail } from 'class-validator';

import IsUnique from '@/_library/validator/is-unique.validator';
import { User } from '@/_user/schema/user.schema';

export class SendOtpDto {
  @IsEmail(undefined, { message: 'A valid email address should be provided.' })
  @IsUnique(User, 'email')
  readonly destination!: string;
}
