import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../db';
import {
  students,
  standards,
  masteryState,
  attempts,
  lessonScripts,
  phenomenonProposals,
} from '../../db/schema';
import { LessonDesignerAgent } from '../lessons/lesson-designer.agent';
import { PracticeGeneratorAgent } from '../practice/practice-generator.agent';

// ── Interfaces ───────────────────────────────────────

export interface DailyPlanItem {
  standard_id: string;
  standard_description: string;
  subject: string;
  grade: number;
  type: 'lesson' | 'practice' | 'phenomenon_evidence' | 'break';
  estimated_minutes: number;
  lesson_script_id?: string;
}

export interface DailyPlan {
  student_id: string;
  date: string;
  total_minutes: number;
  items: DailyPlanItem[];
}

interface StudentProfile {
  id: string;
  name: string;
  age: number;
  grade_target: number;
  interests: string[];
}

interface MasteryRecord {
  standard_id: string;
  mastery_level: number;
  has_direct_lesson_attempt: boolean;
}

interface CandidateStandard {
  id: string;
  description: string;
  subject: string;
  grade: number;
  mastery_level: number;
  has_direct_lesson_attempt: boolean;
  has_attempts: boolean;
  type: 'lesson' | 'practice';
}

// ── Constants ────────────────────────────────────────

const MAX_LESSON_PRACTICE_ITEMS = 6;
const DEFAULT_LESSON_MINUTES = 15;
const DEFAULT_PRACTICE_MINUTES = 10;
const DEFAULT_PHENOMENON_MINUTES = 15;
const BREAK_MINUTES = 5;
const BREAK_THRESHOLD_MINUTES = 20;

@Injectable()
export class OrchestratorAgent {
  private readonly logger = new Logger(OrchestratorAgent.name);

  constructor(
    private readonly lessonDesigner: LessonDesignerAgent,
    private readonly practiceGenerator: PracticeGeneratorAgent,
  ) {}

  async plan(input: {
    student_id: string;
    date: string;
    available_minutes?: number;
  }): Promise<DailyPlan> {
    const availableMinutes = input.available_minutes ?? 120;

    // 1. Load student profile
    const student = await this.loadStudent(input.student_id);

    // 2. Load all mastery states for this student
    const masteryRecords = await this.loadMasteryStates(input.student_id);
    const masteryMap = new Map(
      masteryRecords.map((r) => [r.standard_id, r]),
    );

    // 3. Load attempt counts per standard
    const attemptCounts = await this.loadAttemptCounts(input.student_id);

    // 4. Identify candidate standards
    const allStandards = await this.loadStandardsForGrade(student.grade_target);
    const candidates = this.identifyCandidates(
      allStandards,
      masteryMap,
      attemptCounts,
    );

    // 5. Order candidates with subject alternation
    const ordered = this.orderWithSubjectAlternation(candidates);

    // 6. Cap at MAX items
    const capped = ordered.slice(0, MAX_LESSON_PRACTICE_ITEMS);

    // 7. Build plan items with breaks
    let items = this.buildPlanWithBreaks(capped);

    // 8. Check for approved phenomena
    const phenomenonItem = await this.checkApprovedPhenomena(
      input.student_id,
      student,
    );
    if (phenomenonItem) {
      items.push(phenomenonItem);
    }

    // 9. Ensure plan ends with break if last item is lesson/practice
    if (items.length > 0) {
      const lastItem = items[items.length - 1];
      if (lastItem.type === 'lesson' || lastItem.type === 'practice') {
        items.push(this.makeBreakItem());
      }
    }

    // 10. Trim to fit available_minutes
    items = this.trimToFit(items, availableMinutes);

    // 11. Pre-fetch lesson scripts
    items = await this.prefetchScripts(items, student);

    const totalMinutes = items.reduce((sum, i) => sum + i.estimated_minutes, 0);

    this.logger.log(
      `Plan for ${student.name} (${input.date}): ${items.length} items, ${totalMinutes} minutes`,
    );

    return {
      student_id: input.student_id,
      date: input.date,
      total_minutes: totalMinutes,
      items,
    };
  }

  // ── Pure logic methods (testable without DB) ───────

  identifyCandidates(
    allStandards: { id: string; description: string; subject: string; grade: number }[],
    masteryMap: Map<string, MasteryRecord>,
    attemptCounts: Map<string, number>,
  ): CandidateStandard[] {
    const candidates: CandidateStandard[] = [];

    for (const std of allStandards) {
      const mastery = masteryMap.get(std.id);
      const attemptCount = attemptCounts.get(std.id) ?? 0;
      const masteryLevel = mastery?.mastery_level ?? 0;
      const hasDirectLessonAttempt = mastery?.has_direct_lesson_attempt ?? false;

      // Skip mastered standards
      if (masteryLevel >= 0.8 && hasDirectLessonAttempt) continue;

      let type: 'lesson' | 'practice';

      if (attemptCount === 0) {
        // No attempts ever → lesson
        type = 'lesson';
      } else if (masteryLevel < 0.5) {
        // Has attempts, low mastery → reteach (lesson)
        type = 'lesson';
      } else if (masteryLevel >= 0.5 && masteryLevel < 0.8) {
        // Moderate mastery → practice
        type = 'practice';
      } else if (masteryLevel >= 0.8 && !hasDirectLessonAttempt) {
        // High mastery but no direct lesson → still needs lesson
        type = 'lesson';
      } else {
        type = 'practice';
      }

      candidates.push({
        id: std.id,
        description: std.description,
        subject: std.subject,
        grade: std.grade,
        mastery_level: masteryLevel,
        has_direct_lesson_attempt: hasDirectLessonAttempt,
        has_attempts: attemptCount > 0,
        type,
      });
    }

    // Sort by mastery level ascending (lower mastery = higher priority)
    candidates.sort((a, b) => a.mastery_level - b.mastery_level);

    return candidates;
  }

  orderWithSubjectAlternation(candidates: CandidateStandard[]): CandidateStandard[] {
    if (candidates.length <= 1) return candidates;

    // Group by subject, keeping priority order within each group
    const subjectGroups = new Map<string, CandidateStandard[]>();
    for (const c of candidates) {
      if (!subjectGroups.has(c.subject)) {
        subjectGroups.set(c.subject, []);
      }
      subjectGroups.get(c.subject)!.push(c);
    }

    const subjects = Array.from(subjectGroups.keys()).sort();
    const result: CandidateStandard[] = [];
    let subjectIndex = 0;

    // Round-robin through subjects
    while (result.length < candidates.length) {
      const subject = subjects[subjectIndex % subjects.length];
      const group = subjectGroups.get(subject)!;
      if (group.length > 0) {
        result.push(group.shift()!);
      }
      subjectIndex++;

      // Skip empty groups
      if (Array.from(subjectGroups.values()).every((g) => g.length === 0)) {
        break;
      }
    }

    return result;
  }

  buildPlanWithBreaks(candidates: CandidateStandard[]): DailyPlanItem[] {
    const items: DailyPlanItem[] = [];
    let minutesSinceBreak = 0;

    for (const candidate of candidates) {
      const estimatedMinutes =
        candidate.type === 'lesson' ? DEFAULT_LESSON_MINUTES : DEFAULT_PRACTICE_MINUTES;

      // Insert break if threshold reached
      if (minutesSinceBreak >= BREAK_THRESHOLD_MINUTES) {
        items.push(this.makeBreakItem());
        minutesSinceBreak = 0;
      }

      items.push({
        standard_id: candidate.id,
        standard_description: candidate.description,
        subject: candidate.subject,
        grade: candidate.grade,
        type: candidate.type,
        estimated_minutes: estimatedMinutes,
      });

      minutesSinceBreak += estimatedMinutes;
    }

    return items;
  }

  trimToFit(items: DailyPlanItem[], availableMinutes: number): DailyPlanItem[] {
    const result: DailyPlanItem[] = [];
    let totalMinutes = 0;

    for (const item of items) {
      if (totalMinutes + item.estimated_minutes > availableMinutes) break;
      result.push(item);
      totalMinutes += item.estimated_minutes;
    }

    return result;
  }

  // ── Private DB methods ─────────────────────────────

  private async loadStudent(studentId: string): Promise<StudentProfile> {
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!student) {
      throw new NotFoundException(`Student "${studentId}" not found`);
    }

    return {
      id: student.id,
      name: student.name,
      age: student.age,
      grade_target: student.gradeTarget,
      interests: (student.interests as string[]) ?? [],
    };
  }

  private async loadMasteryStates(studentId: string): Promise<MasteryRecord[]> {
    const rows = await db
      .select({
        standardId: masteryState.standardId,
        masteryLevel: masteryState.masteryLevel,
        hasDirectLessonAttempt: masteryState.hasDirectLessonAttempt,
      })
      .from(masteryState)
      .where(eq(masteryState.studentId, studentId));

    return rows.map((r) => ({
      standard_id: r.standardId,
      mastery_level: r.masteryLevel,
      has_direct_lesson_attempt: r.hasDirectLessonAttempt,
    }));
  }

  private async loadAttemptCounts(
    studentId: string,
  ): Promise<Map<string, number>> {
    const rows = await db
      .select({
        standardId: attempts.standardId,
        count: sql<number>`count(*)::int`,
      })
      .from(attempts)
      .where(eq(attempts.studentId, studentId))
      .groupBy(attempts.standardId);

    return new Map(rows.map((r) => [r.standardId, r.count]));
  }

  private async loadStandardsForGrade(
    gradeTarget: number,
  ): Promise<{ id: string; description: string; subject: string; grade: number }[]> {
    return db
      .select({
        id: standards.id,
        description: standards.description,
        subject: standards.subject,
        grade: standards.grade,
      })
      .from(standards)
      .where(eq(standards.grade, gradeTarget))
      .orderBy(standards.id);
  }

  private makeBreakItem(): DailyPlanItem {
    return {
      standard_id: '',
      standard_description: 'Descanso',
      subject: '',
      grade: 0,
      type: 'break',
      estimated_minutes: BREAK_MINUTES,
    };
  }

  private async checkApprovedPhenomena(
    studentId: string,
    student: StudentProfile,
  ): Promise<DailyPlanItem | null> {
    const [phenomenon] = await db
      .select()
      .from(phenomenonProposals)
      .where(
        and(
          eq(phenomenonProposals.studentId, studentId),
          eq(phenomenonProposals.status, 'approved'),
        ),
      )
      .limit(1);

    if (!phenomenon) return null;

    return {
      standard_id: '',
      standard_description: phenomenon.title,
      subject: '',
      grade: student.grade_target,
      type: 'phenomenon_evidence',
      estimated_minutes: DEFAULT_PHENOMENON_MINUTES,
    };
  }

  private async prefetchScripts(
    items: DailyPlanItem[],
    student: StudentProfile,
  ): Promise<DailyPlanItem[]> {
    const result: DailyPlanItem[] = [];

    for (const item of items) {
      if (item.type !== 'lesson' && item.type !== 'practice') {
        result.push(item);
        continue;
      }

      // Check if a script already exists for this standard
      const [existing] = await db
        .select({ id: lessonScripts.id })
        .from(lessonScripts)
        .where(
          and(
            eq(lessonScripts.standardId, item.standard_id),
            eq(lessonScripts.safetyApproved, true),
          ),
        )
        .orderBy(sql`${lessonScripts.createdAt} DESC`)
        .limit(1);

      if (existing) {
        result.push({ ...item, lesson_script_id: existing.id });
        continue;
      }

      // Generate a new script
      try {
        if (item.type === 'lesson') {
          const generated = await this.lessonDesigner.generate({
            standard_id: item.standard_id,
            student_age: student.age,
          });
          result.push({ ...item, lesson_script_id: generated.id });
        } else {
          const generated = await this.practiceGenerator.generate({
            standard_id: item.standard_id,
            mastery_level: 0.5,
            student_age: student.age,
          });
          result.push({ ...item, lesson_script_id: generated.id });
        }
      } catch (error) {
        this.logger.error(
          `Failed to generate script for ${item.standard_id}: ${error}`,
        );
        // Still include the item, just without a script ID
        result.push(item);
      }
    }

    return result;
  }
}
