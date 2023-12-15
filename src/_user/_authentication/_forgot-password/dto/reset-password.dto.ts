import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  IsStrongPasswordOptions,
  ValidationArguments,
} from 'class-validator';

import ShouldExist from '@/_library/validator/should-exist.validator';
import { User } from '@/_user/_user/schema/user.schema';

export class ResetPasswordDto {
  @IsEmail(undefined, { message: 'A valid email address should be provided.' })
  @ShouldExist(User)
  readonly email!: string;

  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message: ({ property, constraints }: ValidationArguments) => {
        const {
          minLength,
          minLowercase,
          minUppercase,
          minNumbers,
          minSymbols,
        } = constraints[0] as IsStrongPasswordOptions;

        return `The ${property} should be ${minLength} character(s) long with at least: ${minLowercase} lowercase character(s), ${minUppercase} uppercase character(s), ${minNumbers} number(s), and ${minSymbols} symbol(s).`;
      },
    },
  )
  readonly password!: string;

  @IsString()
  @IsNotEmpty()
  readonly otp!: string;
}
