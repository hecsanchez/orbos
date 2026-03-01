import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StandardResponseDto {
  @ApiProperty({ example: 'SEP-MAT-1-1.1' })
  id: string;

  @ApiProperty({ example: 1 })
  grade: number;

  @ApiProperty({ example: 'Matematicas' })
  subject: string;

  @ApiPropertyOptional({ example: 'Estudio de los números' })
  topic: string | null;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: [String] })
  prerequisites: string[];
}
