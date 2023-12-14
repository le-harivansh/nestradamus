import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail(undefined, { message: 'A valid email address should be provided.' })
  readonly email!: string;

  @IsNotEmpty({ message: 'A password should be provided' })
  readonly password!: string;
}
