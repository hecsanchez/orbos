import { Controller, Post, Get, Param, Body, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { lessonScripts } from '../db/schema';
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

  @Get(':id')
  @ApiOperation({ summary: 'Get a lesson script by ID' })
  async findOne(@Param('id') id: string): Promise<LessonScriptResponseDto> {
    const [row] = await db
      .select()
      .from(lessonScripts)
      .where(eq(lessonScripts.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Lesson script "${id}" not found`);
    }

    return {
      id: row.id,
      standard_id: row.standardId,
      script: row.scriptJson as unknown[],
      safety_approved: row.safetyApproved,
      admin_approved: row.adminApproved,
    };
  }
}
