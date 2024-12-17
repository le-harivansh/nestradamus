import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

@ApiSchema({ description: 'The new password of the user.' })
export class ResetPasswordDto {
  @ApiProperty({ example: 'n3w-P@ssw0rd' })
  @IsString()
  @IsNotEmpty({ message: 'The new password field should not be empty.' })
  readonly newPassword!: string;
}
