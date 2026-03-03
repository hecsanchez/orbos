import {
  Controller,
  Post,
  Put,
  Get,
  Param,
  Body,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { phenomenonProposals, students } from '../db/schema';
import { ProposePhenomenonDto } from './dto/propose-phenomenon.dto';
import { ApprovePhenomenonDto } from './dto/approve-phenomenon.dto';
import { PhenomenonResponseDto } from './dto/phenomenon-response.dto';
import { PhenomenonDesignerAgent } from '../agents/phenomenon/phenomenon-designer.agent';

@ApiTags('phenomena')
@Controller('phenomena')
export class PhenomenaController {
  private readonly logger = new Logger(PhenomenaController.name);

  constructor(private readonly designer: PhenomenonDesignerAgent) {}

  @Post('propose')
  @ApiOperation({ summary: 'Generate phenomenon proposals for a student' })
  async propose(
    @Body() dto: ProposePhenomenonDto,
  ): Promise<PhenomenonResponseDto[]> {
    return this.designer.propose(dto.student_id);
  }

  @Post('batch-propose')
  @ApiOperation({
    summary: 'Generate phenomenon proposals for all students',
  })
  async batchPropose(): Promise<{
    total_students: number;
    total_proposals: number;
    results: { student_id: string; student_name: string; proposals: number; error?: string }[];
  }> {
    const allStudents = await db.select().from(students);
    const results: { student_id: string; student_name: string; proposals: number; error?: string }[] = [];

    for (const student of allStudents) {
      try {
        const proposals = await this.designer.propose(student.id);
        results.push({
          student_id: student.id,
          student_name: student.name,
          proposals: proposals.length,
        });
        this.logger.log(
          `Generated ${proposals.length} proposals for ${student.name}`,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        results.push({
          student_id: student.id,
          student_name: student.name,
          proposals: 0,
          error: message,
        });
        this.logger.error(
          `Failed to generate proposals for ${student.name}: ${message}`,
        );
      }
    }

    return {
      total_students: allStudents.length,
      total_proposals: results.reduce((sum, r) => sum + r.proposals, 0),
      results,
    };
  }

  @Put('batch-approve')
  @ApiOperation({
    summary: 'Approve all pending phenomenon proposals',
  })
  async batchApprove(
    @Body() dto: ApprovePhenomenonDto,
  ): Promise<{ approved_count: number; proposals: PhenomenonResponseDto[] }> {
    const updated = await db
      .update(phenomenonProposals)
      .set({
        status: 'approved',
        approvedBy: dto.approved_by,
        approvedAt: new Date(),
      })
      .where(eq(phenomenonProposals.status, 'pending'))
      .returning();

    return {
      approved_count: updated.length,
      proposals: updated.map((r) => ({
        id: r.id,
        student_id: r.studentId,
        linked_standards: (r.linkedStandards as string[]) ?? [],
        title: r.title,
        facilitation_guide: r.facilitationGuide,
        evidence_prompt: r.evidencePrompt,
        materials_needed: (r.materialsNeeded as string[]) ?? [],
        status: r.status,
        approved_by: r.approvedBy ?? null,
        approved_at: r.approvedAt?.toISOString() ?? null,
      })),
    };
  }

  @Put(':id/approve')
  @ApiOperation({ summary: 'Approve a phenomenon proposal' })
  async approve(
    @Param('id') id: string,
    @Body() dto: ApprovePhenomenonDto,
  ): Promise<PhenomenonResponseDto> {
    const [updated] = await db
      .update(phenomenonProposals)
      .set({
        status: 'approved',
        approvedBy: dto.approved_by,
        approvedAt: new Date(),
      })
      .where(eq(phenomenonProposals.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Phenomenon proposal "${id}" not found`);
    }

    return {
      id: updated.id,
      student_id: updated.studentId,
      linked_standards: (updated.linkedStandards as string[]) ?? [],
      title: updated.title,
      facilitation_guide: updated.facilitationGuide,
      evidence_prompt: updated.evidencePrompt,
      materials_needed: (updated.materialsNeeded as string[]) ?? [],
      status: updated.status,
      approved_by: updated.approvedBy ?? null,
      approved_at: updated.approvedAt?.toISOString() ?? null,
    };
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'List phenomenon proposals for a student' })
  async listByStudent(
    @Param('studentId') studentId: string,
  ): Promise<PhenomenonResponseDto[]> {
    const rows = await db
      .select()
      .from(phenomenonProposals)
      .where(eq(phenomenonProposals.studentId, studentId));

    return rows.map((r) => ({
      id: r.id,
      student_id: r.studentId,
      linked_standards: (r.linkedStandards as string[]) ?? [],
      title: r.title,
      facilitation_guide: r.facilitationGuide,
      evidence_prompt: r.evidencePrompt,
      materials_needed: (r.materialsNeeded as string[]) ?? [],
      status: r.status,
      approved_by: r.approvedBy ?? null,
      approved_at: r.approvedAt?.toISOString() ?? null,
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single phenomenon proposal' })
  async findOne(@Param('id') id: string): Promise<PhenomenonResponseDto> {
    const [row] = await db
      .select()
      .from(phenomenonProposals)
      .where(eq(phenomenonProposals.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Phenomenon proposal "${id}" not found`);
    }

    return {
      id: row.id,
      student_id: row.studentId,
      linked_standards: (row.linkedStandards as string[]) ?? [],
      title: row.title,
      facilitation_guide: row.facilitationGuide,
      evidence_prompt: row.evidencePrompt,
      materials_needed: (row.materialsNeeded as string[]) ?? [],
      status: row.status,
      approved_by: row.approvedBy ?? null,
      approved_at: row.approvedAt?.toISOString() ?? null,
    };
  }
}
