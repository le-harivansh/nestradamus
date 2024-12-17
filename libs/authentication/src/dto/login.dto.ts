import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

@ApiSchema({
  description: 'The authentication credentials of the user to authenticate.',
})
export class LoginDto {
  @ApiProperty({ example: 'user@email.dev' })
  @IsString()
  @IsNotEmpty({ message: 'The username field should not be empty.' })
  readonly username!: string;

  @ApiProperty({ example: 'P@ssw0rd' })
  @IsString()
  @IsNotEmpty({ message: 'The password field should not be empty.' })
  readonly password!: string;
}
