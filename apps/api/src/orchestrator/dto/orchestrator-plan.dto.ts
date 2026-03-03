import { ApiProperty } from '@nestjs/swagger';

export class DailyPlanItemDto {
  @ApiProperty({ example: 'SEP-MAT-1-1.1' })
  standard_id!: string;

  @ApiProperty({ example: 'Cuenta colecciones no mayores a 20 elementos.' })
  standard_description!: string;

  @ApiProperty({ example: 'Matematicas' })
  subject!: string;

  @ApiProperty({ example: 1 })
  grade!: number;

  @ApiProperty({ enum: ['lesson', 'practice', 'phenomenon_evidence', 'break'] })
  type!: 'lesson' | 'practice' | 'phenomenon_evidence' | 'break';

  @ApiProperty({ example: 15 })
  estimated_minutes!: number;

  @ApiProperty({ required: false })
  lesson_script_id?: string;
}

export class DailyPlanResponseDto {
  @ApiProperty()
  student_id!: string;

  @ApiProperty({ example: '2026-03-01' })
  date!: string;

  @ApiProperty({ example: 90 })
  total_minutes!: number;

  @ApiProperty({ type: [DailyPlanItemDto] })
  items!: DailyPlanItemDto[];
}
