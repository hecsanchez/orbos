import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { dailyPlans } from '../db/schema';
import { OrchestratorAgent } from '../agents/orchestrator/orchestrator.agent';
import type { DailyPlan } from '../agents/orchestrator/orchestrator.agent';

@ApiTags('orchestrator')
@Controller('orchestrator')
export class OrchestratorController {
  constructor(private readonly orchestrator: OrchestratorAgent) {}

  @Get('daily-plan/:studentId')
  @ApiOperation({ summary: 'Get the daily learning plan for a student' })
  @ApiQuery({ name: 'regenerate', required: false, type: Boolean })
  async getDailyPlan(
    @Param('studentId') studentId: string,
    @Query('regenerate') regenerate?: string,
  ): Promise<DailyPlan> {
    const today = new Date().toISOString().split('T')[0];
    const shouldRegenerate = regenerate === 'true';

    // Check cache unless regenerate=true
    if (!shouldRegenerate) {
      const [cached] = await db
        .select()
        .from(dailyPlans)
        .where(
          and(
            eq(dailyPlans.studentId, studentId),
            eq(dailyPlans.date, today),
          ),
        )
        .limit(1);

      if (cached) {
        return cached.planJson as DailyPlan;
      }
    }

    // Generate fresh plan
    const plan = await this.orchestrator.plan({
      student_id: studentId,
      date: today,
    });

    // Upsert into cache
    await db
      .insert(dailyPlans)
      .values({
        studentId,
        date: today,
        planJson: plan,
        generatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [dailyPlans.studentId, dailyPlans.date],
        set: {
          planJson: plan,
          generatedAt: new Date(),
        },
      });

    return plan;
  }
}
