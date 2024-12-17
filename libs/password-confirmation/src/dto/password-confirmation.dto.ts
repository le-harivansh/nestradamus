import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

@ApiSchema({
  description: 'The password of the authenticated user to confirm.',
})
export class PasswordConfirmationDto {
  @ApiProperty({ example: 'P@ssw0rd' })
  @IsString()
  @IsNotEmpty({ message: 'The password field should not be empty.' })
  readonly password!: string;
}
