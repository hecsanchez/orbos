import { ApiProperty } from '@nestjs/swagger';

export class StudentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  age!: number;

  @ApiProperty()
  grade_target!: number;

  @ApiProperty({ type: [String] })
  interests!: string[];
}
