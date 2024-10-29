import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'The new password field should not be empty.' })
  readonly newPassword!: string;
}
