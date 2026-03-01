import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GenerateLessonDto } from './dto/generate-lesson.dto';
import { LessonScriptResponseDto } from './dto/lesson-script-response.dto';

@ApiTags('lessons')
@Controller('lessons')
export class LessonsController {
  @Post('generate')
  @ApiOperation({ summary: 'Generate a lesson script for a standard' })
  generate(@Body() dto: GenerateLessonDto): LessonScriptResponseDto {
    return {
      id: '00000000-0000-0000-0000-000000000000',
      standard_id: dto.standard_id,
      script: [],
      safety_approved: false,
      admin_approved: false,
    };
  }
}
