import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GenerateLessonDto } from './dto/generate-lesson.dto';
import { LessonScriptResponseDto } from './dto/lesson-script-response.dto';
import { LessonDesignerAgent } from '../agents/lessons/lesson-designer.agent';

@ApiTags('lessons')
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonDesigner: LessonDesignerAgent) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a lesson script for a standard' })
  async generate(@Body() dto: GenerateLessonDto): Promise<LessonScriptResponseDto> {
    return this.lessonDesigner.generate({
      standard_id: dto.standard_id,
      student_age: dto.student_age,
    });
  }
}
