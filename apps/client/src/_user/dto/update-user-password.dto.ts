import { IsStrongPassword } from 'class-validator';

import { PASSWORD_CONSTRAINTS } from '../constant';

export class UpdateUserPasswordDto {
  @IsStrongPassword({
    minLength: PASSWORD_CONSTRAINTS.MIN_LENGTH,
    minLowercase: PASSWORD_CONSTRAINTS.MIN_LOWERCASE,
    minUppercase: PASSWORD_CONSTRAINTS.MIN_UPPERCASE,
    minNumbers: PASSWORD_CONSTRAINTS.MIN_NUMBERS,
    minSymbols: PASSWORD_CONSTRAINTS.MIN_SYMBOLS,
  })
  readonly password!: string;
}
