import { ApiProperty } from '@nestjs/swagger';

export class EvidenceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  student_id!: string;

  @ApiProperty()
  standard_id!: string;

  @ApiProperty()
  phenomenon_id!: string | null;

  @ApiProperty({ enum: ['photo', 'audio'] })
  type!: 'photo' | 'audio';

  @ApiProperty()
  storage_url!: string;

  @ApiProperty()
  captured_at!: string;
}
