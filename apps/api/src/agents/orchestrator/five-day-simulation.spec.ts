/**
 * D19 — Five-Day Simulated Week E2E Integration Test
 *
 * Simulates 5 days of learning for 3 student profiles (ages 5, 8, 11).
 * Tests the full pipeline: orchestrator → lesson assignment → attempts → mastery update.
 * Verifies mastery progression, subject alternation, break insertion, and plan adaptation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrchestratorAgent } from './orchestrator.agent';
import type { DailyPlanItem } from './orchestrator.agent';
import { MasteryEstimatorAgent } from '../mastery/mastery-estimator.agent';
import type { AttemptInput, MasteryEstimate } from '../mastery/mastery-estimator.agent';

// ── Mock DB ──────────────────────────────────────────

vi.mock('../../db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
          groupBy: vi.fn().mockResolvedValue([]),
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
        orderBy: vi.fn().mockResolvedValue([]),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
        onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
        returning: vi.fn().mockResolvedValue([{ id: 'test-id' }]),
      }),
    }),
  },
}));

// ── Student Profiles ──────────────────────────────────

interface SimulatedStudent {
  id: string;
  name: string;
  age: number;
  grade: number;
  standards: { id: string; description: string; subject: string; grade: number }[];
}

const STUDENTS: SimulatedStudent[] = [
  {
    id: 'student-ana-5',
    name: 'Ana',
    age: 5,
    grade: 1,
    standards: [
      { id: 'SEP-MAT-1-1.1', description: 'Contar del 1 al 10', subject: 'Matematicas', grade: 1 },
      { id: 'SEP-MAT-1-1.2', description: 'Sumas simples hasta 5', subject: 'Matematicas', grade: 1 },
      { id: 'SEP-ESP-1-1.1', description: 'Identificar letras del abecedario', subject: 'Espanol', grade: 1 },
      { id: 'SEP-ESP-1-1.2', description: 'Escribir nombre propio', subject: 'Espanol', grade: 1 },
      { id: 'SEP-CIE-1-1.1', description: 'Seres vivos y no vivos', subject: 'Ciencias', grade: 1 },
      { id: 'SEP-CIE-1-1.2', description: 'Partes del cuerpo', subject: 'Ciencias', grade: 1 },
    ],
  },
  {
    id: 'student-miguel-8',
    name: 'Miguel',
    age: 8,
    grade: 3,
    standards: [
      { id: 'SEP-MAT-3-1.1', description: 'Multiplicación hasta 10x10', subject: 'Matematicas', grade: 3 },
      { id: 'SEP-MAT-3-1.2', description: 'Fracciones básicas', subject: 'Matematicas', grade: 3 },
      { id: 'SEP-ESP-3-1.1', description: 'Comprensión lectora nivel 3', subject: 'Espanol', grade: 3 },
      { id: 'SEP-ESP-3-1.2', description: 'Escritura de párrafos', subject: 'Espanol', grade: 3 },
      { id: 'SEP-CIE-3-1.1', description: 'Estados de la materia', subject: 'Ciencias', grade: 3 },
      { id: 'SEP-CIE-3-1.2', description: 'Fuerza y movimiento', subject: 'Ciencias', grade: 3 },
    ],
  },
  {
    id: 'student-sofia-11',
    name: 'Sofia',
    age: 11,
    grade: 5,
    standards: [
      { id: 'SEP-MAT-5-1.1', description: 'Operaciones con decimales', subject: 'Matematicas', grade: 5 },
      { id: 'SEP-MAT-5-1.2', description: 'Geometría: áreas', subject: 'Matematicas', grade: 5 },
      { id: 'SEP-ESP-5-1.1', description: 'Texto argumentativo', subject: 'Espanol', grade: 5 },
      { id: 'SEP-ESP-5-1.2', description: 'Ortografía avanzada', subject: 'Espanol', grade: 5 },
      { id: 'SEP-CIE-5-1.1', description: 'Ecosistemas', subject: 'Ciencias', grade: 5 },
      { id: 'SEP-CIE-5-1.2', description: 'Ciclo del agua', subject: 'Ciencias', grade: 5 },
    ],
  },
];

// ── Simulation Helpers ──────────────────────────────────

/**
 * Simulates student attempts for a plan item.
 * Performance increases over days as the student "learns":
 * - Day 1: ~40% correct, some hints
 * - Day 2: ~55% correct, fewer hints
 * - Day 3: ~70% correct
 * - Day 4: ~80% correct
 * - Day 5: ~90% correct
 */
function simulateAttempts(
  day: number,
  standardId: string,
  type: 'lesson' | 'practice',
): AttemptInput[] {
  const attemptsPerItem = type === 'lesson' ? 4 : 3;
  const correctProbability = Math.min(0.95, 0.3 + day * 0.15);
  const hintProbability = Math.max(0.05, 0.4 - day * 0.1);

  const attempts: AttemptInput[] = [];
  // Use deterministic seeding for reproducibility
  let seed = hashCode(`${standardId}-day${day}`);

  for (let i = 0; i < attemptsPerItem; i++) {
    seed = nextSeed(seed);
    const correct = pseudoRandom(seed) < correctProbability;
    seed = nextSeed(seed);
    const hintUsed = !correct && pseudoRandom(seed) < hintProbability;
    seed = nextSeed(seed);
    const timeSpent = correct ? 5 + Math.floor(pseudoRandom(seed) * 20) : 15 + Math.floor(pseudoRandom(seed) * 30);

    attempts.push({
      correct,
      hint_used: hintUsed,
      time_spent_seconds: timeSpent,
      source: 'lesson',
    });
  }

  return attempts;
}

function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function nextSeed(seed: number): number {
  return ((seed * 1103515245 + 12345) & 0x7fffffff);
}

function pseudoRandom(seed: number): number {
  return (seed % 10000) / 10000;
}

// ── Tests ────────────────────────────────────────────

describe('Five-Day Simulated Week', () => {
  let orchestrator: OrchestratorAgent;
  let mastery: MasteryEstimatorAgent;

  const mockLessonDesigner = { generate: vi.fn() };
  const mockPracticeGenerator = { generate: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    orchestrator = new OrchestratorAgent(
      mockLessonDesigner as any,
      mockPracticeGenerator as any,
    );
    mastery = new MasteryEstimatorAgent();
  });

  for (const student of STUDENTS) {
    describe(`${student.name} (age ${student.age}, grade ${student.grade})`, () => {
      it('completes 5 days with mastery progression', () => {
        // Track all attempts per standard across all days
        const attemptHistory = new Map<string, AttemptInput[]>();
        // Track mastery over time
        const masteryHistory = new Map<string, number[]>();

        for (const std of student.standards) {
          attemptHistory.set(std.id, []);
          masteryHistory.set(std.id, []);
        }

        for (let day = 1; day <= 5; day++) {
          // === STEP 1: Generate daily plan ===
          const masteryMap = new Map<string, {
            standard_id: string;
            mastery_level: number;
            has_direct_lesson_attempt: boolean;
          }>();

          // Build mastery map from accumulated history
          for (const std of student.standards) {
            const history = attemptHistory.get(std.id)!;
            if (history.length === 0) continue;
            const score = mastery.computeScore(history);
            masteryMap.set(std.id, {
              standard_id: std.id,
              mastery_level: score.mastery_level,
              has_direct_lesson_attempt: score.has_direct_lesson_attempt,
            });
          }

          // Build attempt count map
          const attemptCounts = new Map<string, number>();
          for (const std of student.standards) {
            attemptCounts.set(std.id, attemptHistory.get(std.id)!.length);
          }

          // Identify candidates and build plan
          const candidates = orchestrator.identifyCandidates(
            student.standards,
            masteryMap,
            attemptCounts,
          );
          const ordered = orchestrator.orderWithSubjectAlternation(candidates);
          const capped = ordered.slice(0, 6);
          const items = orchestrator.buildPlanWithBreaks(capped);
          const trimmed = orchestrator.trimToFit(items, 120);

          // === STEP 2: Validate plan structure ===
          expect(trimmed.length).toBeGreaterThan(0);

          const lessonPracticeItems = trimmed.filter(
            (i) => i.type === 'lesson' || i.type === 'practice',
          );
          expect(lessonPracticeItems.length).toBeLessThanOrEqual(6);

          // Validate total time fits within 120 minutes
          const totalMinutes = trimmed.reduce(
            (sum, i) => sum + i.estimated_minutes,
            0,
          );
          expect(totalMinutes).toBeLessThanOrEqual(120);

          // Validate subject alternation — no 2 consecutive same subject
          for (let i = 1; i < trimmed.length; i++) {
            const curr = trimmed[i];
            const prev = trimmed[i - 1];
            if (
              curr.type !== 'break' &&
              prev.type !== 'break' &&
              curr.subject &&
              prev.subject
            ) {
              expect(curr.subject).not.toBe(prev.subject);
            }
          }

          // === STEP 3: Simulate attempts on each item ===
          for (const item of lessonPracticeItems) {
            const newAttempts = simulateAttempts(day, item.standard_id, item.type);
            const existingAttempts = attemptHistory.get(item.standard_id)!;
            existingAttempts.push(...newAttempts);
          }

          // === STEP 4: Compute mastery after today's session ===
          for (const std of student.standards) {
            const history = attemptHistory.get(std.id)!;
            if (history.length === 0) continue;
            const score = mastery.computeScore(history);
            masteryHistory.get(std.id)!.push(score.mastery_level);
          }
        }

        // === FINAL ASSERTIONS ===

        // 1. At least some standards should have mastery > 0 by day 5
        const standardsWithMastery = Array.from(masteryHistory.entries()).filter(
          ([, levels]) => levels.length > 0 && levels[levels.length - 1] > 0,
        );
        expect(standardsWithMastery.length).toBeGreaterThan(0);

        // 2. Mastery should generally trend upward (non-decreasing trend over 5 days)
        for (const [standardId, levels] of masteryHistory.entries()) {
          if (levels.length < 2) continue;
          // The final mastery should be higher than the first
          expect(levels[levels.length - 1]).toBeGreaterThanOrEqual(levels[0]);
        }

        // 3. At least one standard should reach practice-level mastery (≥ 0.5)
        const hasModeratelyMastered = Array.from(masteryHistory.values()).some(
          (levels) => levels.length > 0 && levels[levels.length - 1] >= 0.5,
        );
        expect(hasModeratelyMastered).toBe(true);

        // 4. All standards with attempts should have hasDirectLessonAttempt = true
        for (const std of student.standards) {
          const history = attemptHistory.get(std.id)!;
          if (history.length === 0) continue;
          const score = mastery.computeScore(history);
          expect(score.has_direct_lesson_attempt).toBe(true);
        }
      });

      it('adapts plan type based on mastery level', () => {
        const masteryMap = new Map([
          [
            student.standards[0].id,
            {
              standard_id: student.standards[0].id,
              mastery_level: 0.0,
              has_direct_lesson_attempt: false,
            },
          ],
          [
            student.standards[1].id,
            {
              standard_id: student.standards[1].id,
              mastery_level: 0.65,
              has_direct_lesson_attempt: true,
            },
          ],
          [
            student.standards[2].id,
            {
              standard_id: student.standards[2].id,
              mastery_level: 0.9,
              has_direct_lesson_attempt: true,
            },
          ],
        ]);
        const attemptCounts = new Map([
          [student.standards[0].id, 0],
          [student.standards[1].id, 5],
          [student.standards[2].id, 8],
        ]);

        const candidates = orchestrator.identifyCandidates(
          student.standards,
          masteryMap,
          attemptCounts,
        );

        // Standard with 0.0 mastery → lesson
        const first = candidates.find((c) => c.id === student.standards[0].id);
        expect(first?.type).toBe('lesson');

        // Standard with 0.65 mastery → practice
        const second = candidates.find(
          (c) => c.id === student.standards[1].id,
        );
        expect(second?.type).toBe('practice');

        // Standard with 0.9 mastery + direct lesson → skipped (mastered)
        const third = candidates.find((c) => c.id === student.standards[2].id);
        expect(third).toBeUndefined();
      });

      it('reduces available items as standards are mastered', () => {
        // Simulate: 4 out of 6 standards mastered
        const masteryMap = new Map(
          student.standards.map((std, i) => [
            std.id,
            {
              standard_id: std.id,
              mastery_level: i < 4 ? 0.9 : 0.3,
              has_direct_lesson_attempt: true,
            },
          ]),
        );
        const attemptCounts = new Map(
          student.standards.map((std) => [std.id, 5]),
        );

        const candidates = orchestrator.identifyCandidates(
          student.standards,
          masteryMap,
          attemptCounts,
        );

        // Only 2 standards should be candidates (the unmastered ones)
        expect(candidates.length).toBe(2);
      });
    });
  }

  describe('Cross-Student Verification', () => {
    it('break insertion follows threshold rules for all profiles', () => {
      for (const student of STUDENTS) {
        const candidates = orchestrator.identifyCandidates(
          student.standards,
          new Map(),
          new Map(),
        );
        const ordered = orchestrator.orderWithSubjectAlternation(candidates);
        const capped = ordered.slice(0, 6);
        const items = orchestrator.buildPlanWithBreaks(capped);

        // Verify break insertion
        let minutesSinceBreak = 0;
        for (const item of items) {
          if (item.type === 'break') {
            minutesSinceBreak = 0;
          } else {
            minutesSinceBreak += item.estimated_minutes;
            // No segment should exceed threshold (20min) + one item's duration
            expect(minutesSinceBreak).toBeLessThanOrEqual(35);
          }
        }
      }
    });

    it('mastery estimator produces correct recommendations at boundaries', () => {
      // Test boundary: exactly 0.8 mastery with direct lesson attempt → advance
      const highAttempts: AttemptInput[] = Array(10).fill(null).map((_, i) => ({
        correct: i >= 2, // 8 out of 10 correct
        hint_used: false,
        time_spent_seconds: 8,
        source: 'lesson' as const,
      }));
      const highScore = mastery.computeScore(highAttempts);
      expect(highScore.mastery_level).toBeGreaterThanOrEqual(0.8);
      expect(highScore.recommendation).toBe('advance');

      // Test: mastery ≥ 0.8 but NO direct lesson → practice
      const phenAttempts: AttemptInput[] = Array(10).fill(null).map(() => ({
        correct: true,
        hint_used: false,
        time_spent_seconds: 8,
        source: 'phenomenon' as const,
      }));
      const phenScore = mastery.computeScore(phenAttempts);
      expect(phenScore.has_direct_lesson_attempt).toBe(false);
      expect(phenScore.recommendation).toBe('practice');

      // Test: mastery < 0.5 → reteach
      const lowAttempts: AttemptInput[] = Array(5).fill(null).map(() => ({
        correct: false,
        hint_used: true,
        time_spent_seconds: 30,
        source: 'lesson' as const,
      }));
      const lowScore = mastery.computeScore(lowAttempts);
      expect(lowScore.mastery_level).toBeLessThan(0.5);
      expect(lowScore.recommendation).toBe('reteach');
    });

    it('phenomenon evidence weighting is 0.8x compared to lesson', () => {
      const lessonAttempt: AttemptInput[] = [{
        correct: true,
        hint_used: false,
        time_spent_seconds: 15,
        source: 'lesson',
      }];
      const phenAttempt: AttemptInput[] = [{
        correct: true,
        hint_used: false,
        time_spent_seconds: 15,
        source: 'phenomenon',
      }];

      const lessonScore = mastery.computeScore(lessonAttempt);
      const phenScore = mastery.computeScore(phenAttempt);

      // Phenomenon score should be 80% of lesson score
      expect(phenScore.mastery_level).toBeCloseTo(
        lessonScore.mastery_level * 0.8,
        2,
      );
    });

    it('hint usage penalizes mastery score', () => {
      const noHint: AttemptInput[] = [{
        correct: true,
        hint_used: false,
        time_spent_seconds: 15,
        source: 'lesson',
      }];
      const withHint: AttemptInput[] = [{
        correct: true,
        hint_used: true,
        time_spent_seconds: 15,
        source: 'lesson',
      }];

      const noHintScore = mastery.computeScore(noHint);
      const withHintScore = mastery.computeScore(withHint);

      expect(withHintScore.mastery_level).toBeLessThan(
        noHintScore.mastery_level,
      );
    });

    it('speed bonus rewards fast correct answers', () => {
      // Use multiple attempts including some incorrect to avoid clamping to 1.0
      const slow: AttemptInput[] = [
        { correct: false, hint_used: false, time_spent_seconds: 20, source: 'lesson' },
        { correct: true, hint_used: false, time_spent_seconds: 30, source: 'lesson' },
        { correct: true, hint_used: false, time_spent_seconds: 25, source: 'lesson' },
      ];
      const fast: AttemptInput[] = [
        { correct: false, hint_used: false, time_spent_seconds: 20, source: 'lesson' },
        { correct: true, hint_used: false, time_spent_seconds: 5, source: 'lesson' },
        { correct: true, hint_used: false, time_spent_seconds: 8, source: 'lesson' },
      ];

      const slowScore = mastery.computeScore(slow);
      const fastScore = mastery.computeScore(fast);

      expect(fastScore.mastery_level).toBeGreaterThan(
        slowScore.mastery_level,
      );
    });

    it('recency weighting favors recent attempts', () => {
      // Pattern: wrong wrong wrong right right right
      const improving: AttemptInput[] = [
        { correct: false, hint_used: false, time_spent_seconds: 20, source: 'lesson' },
        { correct: false, hint_used: false, time_spent_seconds: 20, source: 'lesson' },
        { correct: false, hint_used: false, time_spent_seconds: 20, source: 'lesson' },
        { correct: true, hint_used: false, time_spent_seconds: 15, source: 'lesson' },
        { correct: true, hint_used: false, time_spent_seconds: 10, source: 'lesson' },
        { correct: true, hint_used: false, time_spent_seconds: 8, source: 'lesson' },
      ];

      // Pattern: right right right wrong wrong wrong
      const declining: AttemptInput[] = [
        { correct: true, hint_used: false, time_spent_seconds: 8, source: 'lesson' },
        { correct: true, hint_used: false, time_spent_seconds: 10, source: 'lesson' },
        { correct: true, hint_used: false, time_spent_seconds: 15, source: 'lesson' },
        { correct: false, hint_used: false, time_spent_seconds: 20, source: 'lesson' },
        { correct: false, hint_used: false, time_spent_seconds: 20, source: 'lesson' },
        { correct: false, hint_used: false, time_spent_seconds: 20, source: 'lesson' },
      ];

      const improvingScore = mastery.computeScore(improving);
      const decliningScore = mastery.computeScore(declining);

      // Improving trend should score higher due to recency weighting
      expect(improvingScore.mastery_level).toBeGreaterThan(
        decliningScore.mastery_level,
      );
    });
  });
});
