import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsStrongPassword,
  IsStrongPasswordOptions,
  ValidateIf,
  ValidationArguments,
} from 'class-validator';

import ShouldNotExist from '@/_library/validator/should-not-exist.validator';

import { User } from '../schema/user.schema';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail(undefined, { message: 'A valid email address should be provided.' })
  @ShouldNotExist(User)
  readonly email?: string;

  @IsOptional()
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
  readonly password?: string;

  /**
   * This property should not be processed by the controller.
   * Its only purpose is to throw an error if ALL of the above properties are
   * empty.
   */
  @ValidateIf(({ email, password }: UpdateUserDto) => !(email || password))
  @Transform(() => null)
  @IsNotEmpty({
    message: 'Provide either an email or a password to be updated.',
  })
  readonly _?: never;
}
