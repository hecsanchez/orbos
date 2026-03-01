import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApprovePhenomenonDto {
  @ApiProperty({ example: 'teacher@school.mx' })
  @IsString()
  @MinLength(1)
  approved_by: string;
}
