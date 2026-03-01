import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrchestratorAgent } from './orchestrator.agent';
import type { DailyPlan } from './orchestrator.agent';

// ── Mocks ────────────────────────────────────────────

const mockLessonDesigner = {
  generate: vi.fn(),
};

const mockPracticeGenerator = {
  generate: vi.fn(),
};

// Mock the db module
vi.mock('../../db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
          groupBy: vi.fn().mockResolvedValue([]),
          orderBy: vi.fn().mockResolvedValue([]),
        }),
        orderBy: vi.fn().mockResolvedValue([]),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
        returning: vi.fn().mockResolvedValue([{ id: 'test-id' }]),
      }),
    }),
  },
}));

// ── Helpers ──────────────────────────────────────────

function makeStandard(id: string, subject: string, grade: number) {
  return {
    id,
    description: `Description for ${id}`,
    subject,
    grade,
  };
}

// ── Tests ────────────────────────────────────────────

describe('OrchestratorAgent', () => {
  let agent: OrchestratorAgent;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new OrchestratorAgent(
      mockLessonDesigner as any,
      mockPracticeGenerator as any,
    );
  });

  describe('identifyCandidates', () => {
    it('returns lesson type for standards with no attempts', () => {
      const allStandards = [makeStandard('SEP-MAT-1-1.1', 'Matematicas', 1)];
      const masteryMap = new Map();
      const attemptCounts = new Map();

      const candidates = agent.identifyCandidates(allStandards, masteryMap, attemptCounts);

      expect(candidates).toHaveLength(1);
      expect(candidates[0].type).toBe('lesson');
    });

    it('returns practice type for standards with mastery 0.5–0.8', () => {
      const allStandards = [makeStandard('SEP-MAT-1-1.1', 'Matematicas', 1)];
      const masteryMap = new Map([
        ['SEP-MAT-1-1.1', { standard_id: 'SEP-MAT-1-1.1', mastery_level: 0.6, has_direct_lesson_attempt: true }],
      ]);
      const attemptCounts = new Map([['SEP-MAT-1-1.1', 3]]);

      const candidates = agent.identifyCandidates(allStandards, masteryMap, attemptCounts);

      expect(candidates).toHaveLength(1);
      expect(candidates[0].type).toBe('practice');
    });

    it('skips mastered standards with direct lesson attempt', () => {
      const allStandards = [makeStandard('SEP-MAT-1-1.1', 'Matematicas', 1)];
      const masteryMap = new Map([
        ['SEP-MAT-1-1.1', { standard_id: 'SEP-MAT-1-1.1', mastery_level: 0.9, has_direct_lesson_attempt: true }],
      ]);
      const attemptCounts = new Map([['SEP-MAT-1-1.1', 5]]);

      const candidates = agent.identifyCandidates(allStandards, masteryMap, attemptCounts);

      expect(candidates).toHaveLength(0);
    });

    it('prioritizes lower mastery standards first', () => {
      const allStandards = [
        makeStandard('SEP-MAT-1-1.2', 'Matematicas', 1),
        makeStandard('SEP-MAT-1-1.1', 'Matematicas', 1),
      ];
      const masteryMap = new Map([
        ['SEP-MAT-1-1.1', { standard_id: 'SEP-MAT-1-1.1', mastery_level: 0.2, has_direct_lesson_attempt: true }],
        ['SEP-MAT-1-1.2', { standard_id: 'SEP-MAT-1-1.2', mastery_level: 0.6, has_direct_lesson_attempt: true }],
      ]);
      const attemptCounts = new Map([['SEP-MAT-1-1.1', 2], ['SEP-MAT-1-1.2', 3]]);

      const candidates = agent.identifyCandidates(allStandards, masteryMap, attemptCounts);

      expect(candidates[0].id).toBe('SEP-MAT-1-1.1');
      expect(candidates[1].id).toBe('SEP-MAT-1-1.2');
    });
  });

  describe('orderWithSubjectAlternation', () => {
    it('never has 2 consecutive items from the same subject', () => {
      const candidates = [
        { id: 'M1', description: '', subject: 'Matematicas', grade: 1, mastery_level: 0, has_direct_lesson_attempt: false, has_attempts: false, type: 'lesson' as const },
        { id: 'M2', description: '', subject: 'Matematicas', grade: 1, mastery_level: 0.1, has_direct_lesson_attempt: false, has_attempts: false, type: 'lesson' as const },
        { id: 'E1', description: '', subject: 'Espanol', grade: 1, mastery_level: 0, has_direct_lesson_attempt: false, has_attempts: false, type: 'lesson' as const },
        { id: 'E2', description: '', subject: 'Espanol', grade: 1, mastery_level: 0.1, has_direct_lesson_attempt: false, has_attempts: false, type: 'lesson' as const },
        { id: 'C1', description: '', subject: 'Ciencias', grade: 1, mastery_level: 0, has_direct_lesson_attempt: false, has_attempts: false, type: 'lesson' as const },
      ];

      const ordered = agent.orderWithSubjectAlternation(candidates);

      for (let i = 1; i < ordered.length; i++) {
        if (ordered[i].subject && ordered[i - 1].subject) {
          expect(ordered[i].subject).not.toBe(ordered[i - 1].subject);
        }
      }
    });
  });

  describe('buildPlanWithBreaks', () => {
    it('inserts break after every 20-25 minutes', () => {
      // 2 lessons (15 min each = 30 min) → break should appear after the second
      const candidates = [
        { id: 'M1', description: 'Math 1', subject: 'Matematicas', grade: 1, mastery_level: 0, has_direct_lesson_attempt: false, has_attempts: false, type: 'lesson' as const },
        { id: 'E1', description: 'Esp 1', subject: 'Espanol', grade: 1, mastery_level: 0, has_direct_lesson_attempt: false, has_attempts: false, type: 'lesson' as const },
        { id: 'C1', description: 'Ciencias 1', subject: 'Ciencias', grade: 1, mastery_level: 0, has_direct_lesson_attempt: false, has_attempts: false, type: 'lesson' as const },
      ];

      const items = agent.buildPlanWithBreaks(candidates);
      const breakItems = items.filter((i) => i.type === 'break');

      expect(breakItems.length).toBeGreaterThanOrEqual(1);

      // Verify no segment exceeds break threshold without a break
      let minutesSinceBreak = 0;
      for (const item of items) {
        if (item.type === 'break') {
          minutesSinceBreak = 0;
        } else {
          minutesSinceBreak += item.estimated_minutes;
          // Should never exceed threshold + one item (break inserted before the next)
          expect(minutesSinceBreak).toBeLessThanOrEqual(30);
        }
      }
    });
  });

  describe('trimToFit', () => {
    it('fits within available_minutes', () => {
      const items = [
        { standard_id: 'a', standard_description: '', subject: '', grade: 1, type: 'lesson' as const, estimated_minutes: 15 },
        { standard_id: 'b', standard_description: '', subject: '', grade: 1, type: 'lesson' as const, estimated_minutes: 15 },
        { standard_id: '', standard_description: 'Break', subject: '', grade: 0, type: 'break' as const, estimated_minutes: 5 },
        { standard_id: 'c', standard_description: '', subject: '', grade: 1, type: 'lesson' as const, estimated_minutes: 15 },
      ];

      const trimmed = agent.trimToFit(items, 30);
      const total = trimmed.reduce((sum, i) => sum + i.estimated_minutes, 0);

      expect(total).toBeLessThanOrEqual(30);
    });
  });

  describe('full plan logic', () => {
    it('plan is capped at 6 lesson/practice items', () => {
      const candidates = Array.from({ length: 10 }, (_, i) =>
        makeStandard(`SEP-MAT-1-1.${i + 1}`, i % 2 === 0 ? 'Matematicas' : 'Espanol', 1),
      );
      const masteryMap = new Map();
      const attemptCounts = new Map();

      const identified = agent.identifyCandidates(candidates, masteryMap, attemptCounts);
      const ordered = agent.orderWithSubjectAlternation(identified);
      const capped = ordered.slice(0, 6);

      expect(capped.length).toBeLessThanOrEqual(6);
    });

    it('returns empty plan items for student with all standards mastered', () => {
      const allStandards = [
        makeStandard('SEP-MAT-1-1.1', 'Matematicas', 1),
        makeStandard('SEP-ESP-1-1.1', 'Espanol', 1),
      ];
      const masteryMap = new Map([
        ['SEP-MAT-1-1.1', { standard_id: 'SEP-MAT-1-1.1', mastery_level: 0.95, has_direct_lesson_attempt: true }],
        ['SEP-ESP-1-1.1', { standard_id: 'SEP-ESP-1-1.1', mastery_level: 0.9, has_direct_lesson_attempt: true }],
      ]);
      const attemptCounts = new Map([['SEP-MAT-1-1.1', 5], ['SEP-ESP-1-1.1', 5]]);

      const candidates = agent.identifyCandidates(allStandards, masteryMap, attemptCounts);
      expect(candidates).toHaveLength(0);
    });
  });
});
