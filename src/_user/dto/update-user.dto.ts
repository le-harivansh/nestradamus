import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  ValidateIf,
} from 'class-validator';

import IsUnique from '@/_library/validator/is-unique.validator';

import { User } from '../schema/user.schema';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  @IsUnique(User.name)
  readonly email?: string;

  @IsOptional()
  @MinLength(8, {
    message: ({ constraints }) =>
      `The password should be at least ${constraints} characters long.`,
  })
  readonly password?: string;

  /**
   * This property should not be processed in the DTO.
   * Its only purpose is to throw an error if ALL of the above properties are
   * empty.
   */
  @ValidateIf(({ email, password }: UpdateUserDto) => !(email || password))
  @IsNotEmpty({
    message: 'Provide either an email or a password to be updated.',
  })
  readonly _?: boolean;
}
