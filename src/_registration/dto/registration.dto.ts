import {
  IsString,
  IsStrongPassword,
  IsStrongPasswordOptions,
  MinLength,
  ValidationArguments,
} from 'class-validator';

import IsUnique from '@/_library/validator/is-unique.validator';
import { User } from '@/_user/schema/user.schema';

export class RegisterUserDto {
  @IsString({ message: 'The username should be a string.' })
  @MinLength(4, {
    message: ({ constraints }) =>
      `The username should be at least ${constraints} characters long.`,
  })
  @IsUnique(User.name)
  readonly username!: string;

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
}
