import { ApiProperty } from '@nestjs/swagger';

export class PlanItemDto {
  @ApiProperty({ example: 'SEP-MAT-1-1.1' })
  standard_id: string;

  @ApiProperty({ enum: ['lesson', 'practice', 'phenomenon_evidence'] })
  type: 'lesson' | 'practice' | 'phenomenon_evidence';

  @ApiProperty({ example: 15 })
  estimated_minutes: number;
}

export class OrchestratorPlanDto {
  @ApiProperty()
  student_id: string;

  @ApiProperty({ example: '2026-03-01' })
  date: string;

  @ApiProperty({ type: [PlanItemDto] })
  plan: PlanItemDto[];
}
