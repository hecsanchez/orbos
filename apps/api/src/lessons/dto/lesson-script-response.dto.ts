import { ApiProperty } from '@nestjs/swagger';

export class LessonScriptResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'SEP-MAT-1-1.1' })
  standard_id: string;

  @ApiProperty({ type: [Object] })
  script: unknown[];

  @ApiProperty()
  safety_approved: boolean;

  @ApiProperty()
  admin_approved: boolean;
}
