// ALGORITHM: Weighted scoring v1. Replace this class with IRT or BKT
// implementation when ready. Interface must remain identical.

import { Injectable, Logger } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../db';
import { masteryState } from '../../db/schema';

export type Recommendation = 'advance' | 'practice' | 'reteach';

export interface MasteryEstimate {
  mastery_level: number;
  confidence_score: number;
  recommendation: Recommendation;
  has_direct_lesson_attempt: boolean;
  attempt_count: number;
  reasoning: string;
}

export interface AttemptInput {
  correct: boolean;
  hint_used: boolean;
  time_spent_seconds: number | null;
  source: 'lesson' | 'phenomenon';
}

@Injectable()
export class MasteryEstimatorAgent {
  private readonly logger = new Logger(MasteryEstimatorAgent.name);

  async estimate(input: {
    student_id: string;
    standard_id: string;
    attempts: AttemptInput[];
  }): Promise<MasteryEstimate> {
    const { student_id, standard_id, attempts } = input;

    if (attempts.length === 0) {
      const result: MasteryEstimate = {
        mastery_level: 0.0,
        confidence_score: 0.0,
        recommendation: 'reteach',
        has_direct_lesson_attempt: false,
        attempt_count: 0,
        reasoning: 'No attempts recorded yet.',
      };
      await this.upsertMasteryState(student_id, standard_id, result);
      return result;
    }

    const hasDirectLessonAttempt = attempts.some((a) => a.source === 'lesson');

    // Compute per-attempt scores with recency weighting
    const scores = attempts.map((attempt, index) => {
      const score = attempt.correct ? 1.0 : 0.0;
      const hintPenalty = attempt.hint_used ? 0.3 : 0.0;
      const speedBonus =
        attempt.correct && attempt.time_spent_seconds !== null && attempt.time_spent_seconds < 10
          ? 0.1
          : 0.0;
      const sourceWeight = attempt.source === 'phenomenon' ? 0.8 : 1.0;
      const attemptScore = (score - hintPenalty + speedBonus) * sourceWeight;

      // Recency bias: most recent (last) has weight 1.0, decreasing by 0.1
      const recencyWeight = Math.max(
        0.1,
        1.0 - (attempts.length - 1 - index) * 0.1,
      );

      return { attemptScore, recencyWeight };
    });

    // Weighted average
    const totalWeight = scores.reduce((sum, s) => sum + s.recencyWeight, 0);
    const weightedSum = scores.reduce(
      (sum, s) => sum + s.attemptScore * s.recencyWeight,
      0,
    );
    const masteryLevel = Math.min(1.0, Math.max(0.0, weightedSum / totalWeight));

    // Confidence score based on attempt count (more attempts → higher confidence)
    const confidenceScore = Math.min(1.0, attempts.length / 10);

    // Recommendation logic
    const correctCount = attempts.filter((a) => a.correct).length;
    const hintCount = attempts.filter((a) => a.hint_used).length;

    let recommendation: Recommendation;
    if (masteryLevel >= 0.8 && hasDirectLessonAttempt) {
      recommendation = 'advance';
    } else if (masteryLevel >= 0.8 && !hasDirectLessonAttempt) {
      recommendation = 'practice';
    } else if (masteryLevel >= 0.5) {
      recommendation = 'practice';
    } else {
      recommendation = 'reteach';
    }

    // Build reasoning string
    const reasoning = this.buildReasoning(
      attempts.length,
      correctCount,
      hintCount,
      masteryLevel,
      recommendation,
    );

    const result: MasteryEstimate = {
      mastery_level: Math.round(masteryLevel * 1000) / 1000,
      confidence_score: Math.round(confidenceScore * 1000) / 1000,
      recommendation,
      has_direct_lesson_attempt: hasDirectLessonAttempt,
      attempt_count: attempts.length,
      reasoning,
    };

    await this.upsertMasteryState(student_id, standard_id, result);

    this.logger.log(
      `Mastery for ${student_id}/${standard_id}: ${result.mastery_level} → ${result.recommendation}`,
    );

    return result;
  }

  /**
   * Pure scoring logic extracted for testability (no DB interaction).
   */
  computeScore(attempts: AttemptInput[]): {
    mastery_level: number;
    has_direct_lesson_attempt: boolean;
    recommendation: Recommendation;
  } {
    if (attempts.length === 0) {
      return {
        mastery_level: 0.0,
        has_direct_lesson_attempt: false,
        recommendation: 'reteach',
      };
    }

    const hasDirectLessonAttempt = attempts.some((a) => a.source === 'lesson');

    const scores = attempts.map((attempt, index) => {
      const score = attempt.correct ? 1.0 : 0.0;
      const hintPenalty = attempt.hint_used ? 0.3 : 0.0;
      const speedBonus =
        attempt.correct && attempt.time_spent_seconds !== null && attempt.time_spent_seconds < 10
          ? 0.1
          : 0.0;
      const sourceWeight = attempt.source === 'phenomenon' ? 0.8 : 1.0;
      const attemptScore = (score - hintPenalty + speedBonus) * sourceWeight;

      const recencyWeight = Math.max(
        0.1,
        1.0 - (attempts.length - 1 - index) * 0.1,
      );

      return { attemptScore, recencyWeight };
    });

    const totalWeight = scores.reduce((sum, s) => sum + s.recencyWeight, 0);
    const weightedSum = scores.reduce(
      (sum, s) => sum + s.attemptScore * s.recencyWeight,
      0,
    );
    const masteryLevel = Math.min(1.0, Math.max(0.0, weightedSum / totalWeight));

    let recommendation: Recommendation;
    if (masteryLevel >= 0.8 && hasDirectLessonAttempt) {
      recommendation = 'advance';
    } else if (masteryLevel >= 0.8 && !hasDirectLessonAttempt) {
      recommendation = 'practice';
    } else if (masteryLevel >= 0.5) {
      recommendation = 'practice';
    } else {
      recommendation = 'reteach';
    }

    return {
      mastery_level: Math.round(masteryLevel * 1000) / 1000,
      has_direct_lesson_attempt: hasDirectLessonAttempt,
      recommendation,
    };
  }

  private buildReasoning(
    totalAttempts: number,
    correctCount: number,
    hintCount: number,
    masteryLevel: number,
    recommendation: Recommendation,
  ): string {
    const parts: string[] = [];

    parts.push(
      `${totalAttempts} attempt${totalAttempts !== 1 ? 's' : ''}, ${correctCount} correct`,
    );

    if (hintCount > 0) {
      parts.push(`${hintCount} with hint`);
    }

    if (masteryLevel >= 0.8) {
      parts.push('Strong performance');
    } else if (masteryLevel >= 0.5) {
      parts.push('Moderate performance');
    } else {
      parts.push('Needs more practice');
    }

    const recMap: Record<Recommendation, string> = {
      advance: 'Ready to advance.',
      practice: 'More practice recommended.',
      reteach: 'Reteaching recommended.',
    };
    parts.push(recMap[recommendation]);

    return parts.join('. ') + (parts[parts.length - 1].endsWith('.') ? '' : '');
  }

  private async upsertMasteryState(
    studentId: string,
    standardId: string,
    estimate: MasteryEstimate,
  ): Promise<void> {
    try {
      await db
        .insert(masteryState)
        .values({
          studentId,
          standardId,
          masteryLevel: estimate.mastery_level,
          confidenceScore: estimate.confidence_score,
          hasDirectLessonAttempt: estimate.has_direct_lesson_attempt,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [masteryState.studentId, masteryState.standardId],
          set: {
            masteryLevel: estimate.mastery_level,
            confidenceScore: estimate.confidence_score,
            hasDirectLessonAttempt: estimate.has_direct_lesson_attempt,
            updatedAt: new Date(),
          },
        });
    } catch (error) {
      this.logger.error('Failed to upsert mastery state:', error);
    }
  }
}
