import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { safetyLogs } from '../db/schema';

@ApiTags('safety')
@Controller('safety')
export class SafetyLogController {
  @Get('logs')
  @ApiOperation({ summary: 'List safety logs' })
  async list(
    @Query('passed') passed?: string,
    @Query('content_type') contentType?: string,
  ) {
    let query = db.select().from(safetyLogs);

    if (passed !== undefined) {
      query = query.where(
        eq(safetyLogs.passed, passed === 'true'),
      ) as typeof query;
    }

    if (contentType) {
      query = query.where(
        eq(safetyLogs.contentType, contentType),
      ) as typeof query;
    }

    const rows = await query;

    return rows.map((r) => ({
      id: r.id,
      content_type: r.contentType,
      content_id: r.contentId,
      passed: r.passed,
      flags: r.flags,
      attempt_number: r.attemptNumber,
      created_at: r.createdAt.toISOString(),
    }));
  }
}
