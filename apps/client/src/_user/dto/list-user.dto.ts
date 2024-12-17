import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class ListUserDto {
  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  readonly skip: number = 0;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  readonly limit: number = 0;
}
