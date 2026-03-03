import { ApiProperty } from '@nestjs/swagger';

export class AttemptResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  student_id!: string;

  @ApiProperty()
  standard_id!: string;

  @ApiProperty()
  interaction_component!: string;

  @ApiProperty()
  correct!: boolean;

  @ApiProperty()
  time_spent_seconds!: number;

  @ApiProperty()
  hint_used!: boolean;

  @ApiProperty({ enum: ['lesson', 'phenomenon'] })
  source!: 'lesson' | 'phenomenon';

  @ApiProperty()
  created_at!: string;
}
