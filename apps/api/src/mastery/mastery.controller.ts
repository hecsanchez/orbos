import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MasteryResponseDto } from './dto/mastery-response.dto';

@ApiTags('mastery')
@Controller('mastery')
export class MasteryController {
  @Get(':studentId/:standardId')
  @ApiOperation({ summary: 'Get mastery state for a student on a standard' })
  findOne(
    @Param('studentId') studentId: string,
    @Param('standardId') standardId: string,
  ): MasteryResponseDto {
    return {
      student_id: studentId,
      standard_id: standardId,
      mastery_level: 0,
      confidence_score: 0,
      has_direct_lesson_attempt: false,
      recommendation: 'practice',
    };
  }
}
