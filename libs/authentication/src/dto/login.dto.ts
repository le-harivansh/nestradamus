import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'The username field should not be empty.' })
  readonly username!: string;

  @IsString()
  @IsNotEmpty({ message: 'The password field should not be empty.' })
  readonly password!: string;
}
