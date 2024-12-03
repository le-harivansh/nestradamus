import { IsNotEmpty, IsString } from 'class-validator';

export class PasswordConfirmationDto {
  @IsString()
  @IsNotEmpty({ message: 'The password field should not be empty.' })
  readonly password!: string;
}
