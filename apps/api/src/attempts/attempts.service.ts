import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { attempts, dailyPlans } from '../db/schema';
import { MasteryEstimatorAgent } from '../agents/mastery/mastery-estimator.agent';
import type { MasteryEstimate } from '../agents/mastery/mastery-estimator.agent';
import { LogAttemptDto } from './dto/log-attempt.dto';
import { AttemptResponseDto } from './dto/attempt-response.dto';

export interface AttemptWithMastery {
  attempt: AttemptResponseDto;
  mastery: MasteryEstimate;
}

@Injectable()
export class AttemptsService {
  constructor(private readonly masteryEstimator: MasteryEstimatorAgent) {}

  async logAttempt(dto: LogAttemptDto): Promise<AttemptWithMastery> {
    // 1. Insert attempt into attempts table
    const [inserted] = await db
      .insert(attempts)
      .values({
        studentId: dto.student_id,
        standardId: dto.standard_id,
        interactionComponent: dto.interaction_component,
        correct: dto.correct,
        timeSpentSeconds: dto.time_spent_seconds,
        hintUsed: dto.hint_used,
        source: dto.source,
      })
      .returning();

    // 2. Fetch all attempts for this student + standard
    const allAttempts = await db
      .select()
      .from(attempts)
      .where(
        and(
          eq(attempts.studentId, dto.student_id),
          eq(attempts.standardId, dto.standard_id),
        ),
      )
      .orderBy(attempts.createdAt);

    // 3. Invalidate today's cached daily plan so orchestrator re-plans
    const today = new Date().toISOString().split('T')[0];
    await db
      .delete(dailyPlans)
      .where(
        and(
          eq(dailyPlans.studentId, dto.student_id),
          eq(dailyPlans.date, today),
        ),
      );

    // 4. Call MasteryEstimatorAgent.estimate()
    const mastery = await this.masteryEstimator.estimate({
      student_id: dto.student_id,
      standard_id: dto.standard_id,
      attempts: allAttempts.map((a) => ({
        correct: a.correct,
        hint_used: a.hintUsed,
        time_spent_seconds: a.timeSpentSeconds,
        source: a.source,
      })),
    });

    // 5. Return the logged attempt with mastery
    const attempt: AttemptResponseDto = {
      id: inserted.id,
      student_id: inserted.studentId,
      standard_id: inserted.standardId,
      interaction_component: inserted.interactionComponent ?? '',
      correct: inserted.correct,
      time_spent_seconds: inserted.timeSpentSeconds ?? 0,
      hint_used: inserted.hintUsed,
      source: inserted.source,
      created_at: inserted.createdAt.toISOString(),
    };

    return { attempt, mastery };
  }
}
