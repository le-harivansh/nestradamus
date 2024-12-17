import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

@ApiSchema({
  description:
    "The username of the registered user to send the 'forgot-password' message (e-mail/sms/etc...) to.",
})
export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@email.dev' })
  @IsString()
  @IsNotEmpty({ message: 'The username field should not be empty.' })
  readonly username!: string;
}
