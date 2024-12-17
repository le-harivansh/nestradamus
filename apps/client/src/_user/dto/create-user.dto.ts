import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';

import { IsPermission } from '@library/authorization';

import { ShouldNotExist } from '../../_database/validator';
import { PASSWORD_CONSTRAINTS } from '../constant';
import { User } from '../schema/user.schema';

@ApiSchema({ description: 'The data of the user to create.' })
export class CreateUserDto {
  @ApiProperty({ example: 'FirstName' })
  @IsString()
  @IsNotEmpty()
  readonly firstName!: string;

  @ApiProperty({ example: 'LastName' })
  @IsString()
  @IsNotEmpty()
  readonly lastName!: string;

  @ApiProperty({ example: 'user@email.dev' })
  @IsEmail()
  @ShouldNotExist(User)
  readonly email!: string;

  @ApiProperty({ example: 'P@ssw0rd' })
  @IsStrongPassword({
    minLength: PASSWORD_CONSTRAINTS.MIN_LENGTH,
    minLowercase: PASSWORD_CONSTRAINTS.MIN_LOWERCASE,
    minUppercase: PASSWORD_CONSTRAINTS.MIN_UPPERCASE,
    minNumbers: PASSWORD_CONSTRAINTS.MIN_NUMBERS,
    minSymbols: PASSWORD_CONSTRAINTS.MIN_SYMBOLS,
  })
  readonly password!: string;

  @ApiProperty({ example: ['user:read:own'] })
  @IsArray()
  @IsPermission({ each: true })
  readonly permissions!: string[];
}
