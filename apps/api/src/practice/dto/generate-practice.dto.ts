import { IsString, IsNumber, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GeneratePracticeDto {
  @ApiProperty({ example: 'SEP-MAT-1-1.1' })
  @IsString()
  standard_id!: string;

  @ApiProperty({ example: 0.6, minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  mastery_level!: number;

  @ApiProperty({ example: 7, minimum: 5, maximum: 11 })
  @IsInt()
  @Min(5)
  @Max(11)
  student_age!: number;
}
