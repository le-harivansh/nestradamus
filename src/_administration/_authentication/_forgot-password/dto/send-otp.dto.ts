import { IsEmail } from 'class-validator';

import { Administrator } from '@/_administration/_administrator/schema/administrator.schema';
import ShouldExist from '@/_library/validator/should-exist.validator';

export class SendOtpDto {
  @IsEmail(undefined, { message: 'A valid email address should be provided.' })
  @ShouldExist(Administrator, 'username')
  readonly destination!: string;
}
