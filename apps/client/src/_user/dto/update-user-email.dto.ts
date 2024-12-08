import { IsEmail } from 'class-validator';

import { ShouldNotExist } from '../../_database/validator';
import { User } from '../schema/user.schema';

export class UpdateUserEmailDto {
  @IsEmail()
  @ShouldNotExist(User)
  readonly email!: string;
}
