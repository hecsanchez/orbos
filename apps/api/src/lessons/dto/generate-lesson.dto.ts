import { IsString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateLessonDto {
  @ApiProperty({ example: 'SEP-MAT-1-1.1' })
  @IsString()
  standard_id: string;

  @ApiProperty({ example: 7, minimum: 5, maximum: 11 })
  @IsInt()
  @Min(5)
  @Max(11)
  student_age: number;
}
