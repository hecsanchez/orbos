import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PhenomenonResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  student_id!: string;

  @ApiProperty({ type: [String] })
  linked_standards!: string[];

  @ApiProperty()
  title!: string;

  @ApiProperty()
  facilitation_guide!: string;

  @ApiProperty()
  evidence_prompt!: string;

  @ApiProperty({ type: [String] })
  materials_needed!: string[];

  @ApiProperty({ enum: ['pending', 'approved', 'completed'] })
  status!: 'pending' | 'approved' | 'completed';

  @ApiPropertyOptional()
  approved_by!: string | null;

  @ApiPropertyOptional()
  approved_at!: string | null;
}
