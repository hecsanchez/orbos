import { ApiProperty } from '@nestjs/swagger';

export class MasteryResponseDto {
  @ApiProperty()
  student_id!: string;

  @ApiProperty()
  standard_id!: string;

  @ApiProperty({ example: 0.65 })
  mastery_level!: number;

  @ApiProperty({ example: 0.8 })
  confidence_score!: number;

  @ApiProperty()
  has_direct_lesson_attempt!: boolean;

  @ApiProperty({ enum: ['advance', 'practice', 'reteach'] })
  recommendation!: 'advance' | 'practice' | 'reteach';
}
