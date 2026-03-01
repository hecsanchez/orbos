import { IsUUID, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadEvidenceDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  student_id: string;

  @ApiProperty({ example: 'SEP-MAT-1-1.1' })
  @IsString()
  standard_id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  phenomenon_id: string;

  @ApiProperty({ enum: ['photo', 'audio'] })
  @IsIn(['photo', 'audio'])
  type: 'photo' | 'audio';
}
