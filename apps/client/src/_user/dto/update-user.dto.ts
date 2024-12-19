import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';

import { IsPermission } from '@library/authorization';

import { ShouldNotExist } from '../../_database/validator';
import { PASSWORD_CONSTRAINTS } from '../constant';
import { User } from '../entity/user.entity';

@ApiSchema({ description: "The user's data to update." })
export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'UpdatedFirstName' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly firstName?: string;

  @ApiPropertyOptional({ example: 'UpdatedLastName' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly lastName?: string;

  @ApiPropertyOptional({ example: 'updated-user@email.dev' })
  @IsOptional()
  @IsEmail()
  @ShouldNotExist(User)
  readonly email?: string;

  @ApiPropertyOptional({ example: 'n3w-P@ssw0rd' })
  @IsOptional()
  @IsStrongPassword({
    minLength: PASSWORD_CONSTRAINTS.MIN_LENGTH,
    minLowercase: PASSWORD_CONSTRAINTS.MIN_LOWERCASE,
    minUppercase: PASSWORD_CONSTRAINTS.MIN_UPPERCASE,
    minNumbers: PASSWORD_CONSTRAINTS.MIN_NUMBERS,
    minSymbols: PASSWORD_CONSTRAINTS.MIN_SYMBOLS,
  })
  readonly password?: string;

  @ApiPropertyOptional({ example: ['user:update:own'] })
  @IsOptional()
  @IsArray()
  @IsPermission({ each: true })
  readonly permissions?: string[];
}
