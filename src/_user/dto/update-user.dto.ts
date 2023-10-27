import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

import UsernameIsUnique from '../validator/username-is-unique.validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'The username should be a string.' })
  @MinLength(4, {
    message: ({ constraints }) =>
      `The username should be at least ${constraints} characters long.`,
  })
  @UsernameIsUnique()
  readonly username?: string;

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
  @ValidateIf(
    ({ username, password }: UpdateUserDto) => !(username || password),
  )
  @IsNotEmpty({
    message: 'Provide either your username or your password to be updated.',
  })
  readonly _?: boolean;
}
