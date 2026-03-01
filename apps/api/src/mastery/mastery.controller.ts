import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { masteryState, attempts } from '../db/schema';

@ApiTags('mastery')
@Controller('mastery')
export class MasteryController {
  @Get(':studentId/:standardId')
  @ApiOperation({ summary: 'Get mastery state for a student on a standard' })
  async findOne(
    @Param('studentId') studentId: string,
    @Param('standardId') standardId: string,
  ) {
    const [state] = await db
      .select()
      .from(masteryState)
      .where(
        and(
          eq(masteryState.studentId, studentId),
          eq(masteryState.standardId, standardId),
        ),
      )
      .limit(1);

    if (!state) {
      return {
        student_id: studentId,
        standard_id: standardId,
        mastery_level: 0.0,
        confidence_score: 0.0,
        recommendation: 'reteach',
        has_direct_lesson_attempt: false,
        attempt_count: 0,
        reasoning: 'No attempts recorded yet.',
      };
    }

    // Count attempts for this student+standard
    const attemptRows = await db
      .select()
      .from(attempts)
      .where(
        and(
          eq(attempts.studentId, studentId),
          eq(attempts.standardId, standardId),
        ),
      );

    const attemptCount = attemptRows.length;
    const masteryLevel = state.masteryLevel;

    let recommendation: string;
    if (masteryLevel >= 0.8 && state.hasDirectLessonAttempt) {
      recommendation = 'advance';
    } else if (masteryLevel >= 0.8 && !state.hasDirectLessonAttempt) {
      recommendation = 'practice';
    } else if (masteryLevel >= 0.5) {
      recommendation = 'practice';
    } else {
      recommendation = 'reteach';
    }

    return {
      student_id: studentId,
      standard_id: standardId,
      mastery_level: masteryLevel,
      confidence_score: state.confidenceScore,
      recommendation,
      has_direct_lesson_attempt: state.hasDirectLessonAttempt,
      attempt_count: attemptCount,
      reasoning: attemptCount === 0 ? 'No attempts recorded yet.' : undefined,
    };
  }
}
