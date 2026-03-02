import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  Query,
  NotFoundException,
} from '@nestjs/common';
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
  async generate(
    @Body() dto: GenerateLessonDto,
  ): Promise<LessonScriptResponseDto> {
    return this.lessonDesigner.generate({
      standard_id: dto.standard_id,
      student_age: dto.student_age,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List lesson scripts' })
  async list(
    @Query('admin_approved') adminApproved?: string,
    @Query('standard_id') standardId?: string,
  ) {
    let query = db.select().from(lessonScripts);

    if (adminApproved !== undefined) {
      query = query.where(
        eq(lessonScripts.adminApproved, adminApproved === 'true'),
      ) as typeof query;
    }

    if (standardId) {
      query = query.where(
        eq(lessonScripts.standardId, standardId),
      ) as typeof query;
    }

    const rows = await query;

    return rows.map((r) => ({
      id: r.id,
      standard_id: r.standardId,
      student_age_target: r.studentAgeTarget,
      script: r.scriptJson as unknown[],
      safety_approved: r.safetyApproved,
      admin_approved: r.adminApproved,
      created_at: r.createdAt.toISOString(),
    }));
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

  @Put(':id/approve')
  @ApiOperation({ summary: 'Approve a lesson script' })
  async approve(@Param('id') id: string) {
    const [updated] = await db
      .update(lessonScripts)
      .set({ adminApproved: true })
      .where(eq(lessonScripts.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Lesson script "${id}" not found`);
    }

    return {
      id: updated.id,
      standard_id: updated.standardId,
      script: updated.scriptJson as unknown[],
      safety_approved: updated.safetyApproved,
      admin_approved: updated.adminApproved,
    };
  }
}
