import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { standards } from '../db/schema';
import { SearchStandardsDto } from './dto/search-standards.dto';
import { StandardResponseDto } from './dto/standard-response.dto';

@ApiTags('standards')
@Controller('standards')
export class StandardsController {
  @Get()
  @ApiOperation({ summary: 'List all standards' })
  async list(@Query('grade') grade?: string) {
    let query = db.select().from(standards);

    if (grade) {
      query = query.where(eq(standards.grade, Number(grade))) as typeof query;
    }

    const rows = await query;

    return rows.map((r) => ({
      id: r.id,
      grade: r.grade,
      subject: r.subject,
      topic: r.topic,
      description: r.description,
      prerequisites: (r.prerequisites as string[]) ?? [],
    }));
  }

  @Get('search')
  @ApiOperation({ summary: 'Search standards by semantic query' })
  search(@Query() dto: SearchStandardsDto): StandardResponseDto[] {
    return [];
  }
}
