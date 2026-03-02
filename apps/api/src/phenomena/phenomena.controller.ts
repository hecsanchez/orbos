import {
  Controller,
  Post,
  Put,
  Get,
  Param,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { phenomenonProposals } from '../db/schema';
import { ProposePhenomenonDto } from './dto/propose-phenomenon.dto';
import { ApprovePhenomenonDto } from './dto/approve-phenomenon.dto';
import { PhenomenonResponseDto } from './dto/phenomenon-response.dto';
import { PhenomenonDesignerAgent } from '../agents/phenomenon/phenomenon-designer.agent';

@ApiTags('phenomena')
@Controller('phenomena')
export class PhenomenaController {
  constructor(private readonly designer: PhenomenonDesignerAgent) {}

  @Post('propose')
  @ApiOperation({ summary: 'Generate phenomenon proposals for a student' })
  async propose(
    @Body() dto: ProposePhenomenonDto,
  ): Promise<PhenomenonResponseDto[]> {
    return this.designer.propose(dto.student_id);
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
