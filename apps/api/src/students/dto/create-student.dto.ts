import { IsString, MinLength, IsInt, Min, Max, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({ example: 'María' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: 7, minimum: 5, maximum: 11 })
  @IsInt()
  @Min(5)
  @Max(11)
  age: number;

  @ApiProperty({ example: 2, minimum: 1, maximum: 6 })
  @IsInt()
  @Min(1)
  @Max(6)
  grade_target: number;

  @ApiProperty({ example: ['dinosaurios', 'música'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  interests: string[];
}
