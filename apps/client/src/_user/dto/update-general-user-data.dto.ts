import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateGeneralUserDataDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly firstName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly lastName?: string;
}
