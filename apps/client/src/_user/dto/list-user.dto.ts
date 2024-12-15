import { Transform } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class ListUserDto {
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  readonly skip: number = 0;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  readonly limit: number = 0;
}
