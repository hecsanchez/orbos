import {
  IsString,
  IsBoolean,
  IsInt,
  Min,
  IsIn,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogAttemptDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  student_id: string;

  @ApiProperty({ example: 'SEP-MAT-1-1.1' })
  @IsString()
  standard_id: string;

  @ApiProperty({ example: 'multiple_choice' })
  @IsString()
  interaction_component: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  correct: boolean;

  @ApiProperty({ example: 45 })
  @IsInt()
  @Min(0)
  time_spent_seconds: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  hint_used: boolean;

  @ApiProperty({ enum: ['lesson', 'phenomenon'] })
  @IsIn(['lesson', 'phenomenon'])
  source: 'lesson' | 'phenomenon';
}
