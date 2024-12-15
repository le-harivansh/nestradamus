import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';

import { IsPermission } from '@library/authorization';

import { ShouldNotExist } from '../../_database/validator';
import { PASSWORD_CONSTRAINTS } from '../constant';
import { User } from '../schema/user.schema';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  readonly firstName!: string;

  @IsString()
  @IsNotEmpty()
  readonly lastName!: string;

  @IsEmail()
  @ShouldNotExist(User)
  readonly email!: string;

  @IsStrongPassword({
    minLength: PASSWORD_CONSTRAINTS.MIN_LENGTH,
    minLowercase: PASSWORD_CONSTRAINTS.MIN_LOWERCASE,
    minUppercase: PASSWORD_CONSTRAINTS.MIN_UPPERCASE,
    minNumbers: PASSWORD_CONSTRAINTS.MIN_NUMBERS,
    minSymbols: PASSWORD_CONSTRAINTS.MIN_SYMBOLS,
  })
  readonly password!: string;

  @IsArray()
  @IsPermission({ each: true })
  readonly permissions!: string[];
}
