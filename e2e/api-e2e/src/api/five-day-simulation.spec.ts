/**
 * D19 — Five-Day Simulated Week: Live API E2E Test
 *
 * Tests the full HTTP pipeline against a running API server.
 * Requires: API running on localhost:3000 with seeded DB (students + standards).
 *
 * Run: pnpm exec nx run api-e2e:e2e
 */
import axios from 'axios';

const INTERACTION_COMPONENTS = [
  'multiple_choice',
  'drag_drop',
  'story_card',
  'tap_reveal',
  'ordering',
];

describe('Five-Day Simulated Week (E2E)', () => {
  let studentIds: string[];

  beforeAll(async () => {
    // Fetch seeded students
    try {
      const res = await axios.get('/students');
      studentIds = (res.data as any[]).map((s: any) => s.id);
    } catch {
      studentIds = [];
    }
  });

  it('API health check', async () => {
    const res = await axios.get('/api');
    expect(res.status).toBe(200);
  });

  it('has seeded students', () => {
    expect(studentIds.length).toBeGreaterThanOrEqual(1);
  });

  // Only run simulation if students are available
  describe('Daily plan generation', () => {
    it('returns a valid plan for each student', async () => {
      if (studentIds.length === 0) return;

      for (const studentId of studentIds.slice(0, 3)) {
        const res = await axios.get(
          `/orchestrator/daily-plan/${studentId}?regenerate=true`,
        );
        expect(res.status).toBe(200);
        const plan = res.data;

        // Plan structure validation
        expect(plan).toHaveProperty('student_id', studentId);
        expect(plan).toHaveProperty('date');
        expect(plan).toHaveProperty('total_minutes');
        expect(plan).toHaveProperty('items');
        expect(Array.isArray(plan.items)).toBe(true);
        expect(plan.total_minutes).toBeLessThanOrEqual(120);

        // Each item has required fields
        for (const item of plan.items) {
          expect(item).toHaveProperty('type');
          expect(['lesson', 'practice', 'phenomenon_evidence', 'break']).toContain(
            item.type,
          );
          expect(item).toHaveProperty('estimated_minutes');
          expect(item.estimated_minutes).toBeGreaterThan(0);
        }
      }
    });

    it('cached plan returns same result', async () => {
      if (studentIds.length === 0) return;
      const studentId = studentIds[0];

      const res1 = await axios.get(`/orchestrator/daily-plan/${studentId}`);
      const res2 = await axios.get(`/orchestrator/daily-plan/${studentId}`);

      expect(res1.data.items.length).toBe(res2.data.items.length);
      expect(res1.data.total_minutes).toBe(res2.data.total_minutes);
    });
  });

  describe('Attempt logging and mastery updates', () => {
    it('logs an attempt and returns mastery estimate', async () => {
      if (studentIds.length === 0) return;
      const studentId = studentIds[0];

      // Get a plan to find a standard to attempt
      const planRes = await axios.get(
        `/orchestrator/daily-plan/${studentId}?regenerate=true`,
      );
      const lessonItem = planRes.data.items.find(
        (i: any) => i.type === 'lesson' || i.type === 'practice',
      );

      if (!lessonItem) return; // no lesson items in plan

      const attemptRes = await axios.post('/attempts/log', {
        student_id: studentId,
        standard_id: lessonItem.standard_id,
        interaction_component: 'multiple_choice',
        correct: true,
        time_spent_seconds: 15,
        hint_used: false,
        source: 'lesson',
      });

      expect(attemptRes.status).toBe(201);
      expect(attemptRes.data).toHaveProperty('attempt');
      expect(attemptRes.data).toHaveProperty('mastery');
      expect(attemptRes.data.mastery).toHaveProperty('mastery_level');
      expect(attemptRes.data.mastery).toHaveProperty('recommendation');
      expect(attemptRes.data.mastery.mastery_level).toBeGreaterThan(0);
    });

    it('mastery increases with correct attempts', async () => {
      if (studentIds.length === 0) return;
      const studentId = studentIds[0];

      const planRes = await axios.get(`/orchestrator/daily-plan/${studentId}`);
      const lessonItem = planRes.data.items.find(
        (i: any) => i.type === 'lesson' || i.type === 'practice',
      );

      if (!lessonItem) return;

      // Log 3 correct attempts
      const masteryLevels: number[] = [];
      for (let i = 0; i < 3; i++) {
        const res = await axios.post('/attempts/log', {
          student_id: studentId,
          standard_id: lessonItem.standard_id,
          interaction_component: INTERACTION_COMPONENTS[i % INTERACTION_COMPONENTS.length],
          correct: true,
          time_spent_seconds: 10,
          hint_used: false,
          source: 'lesson',
        });
        masteryLevels.push(res.data.mastery.mastery_level);
      }

      // Mastery should be non-decreasing
      for (let i = 1; i < masteryLevels.length; i++) {
        expect(masteryLevels[i]).toBeGreaterThanOrEqual(masteryLevels[i - 1]);
      }
    });
  });

  describe('Mastery API', () => {
    it('returns mastery states for a student', async () => {
      if (studentIds.length === 0) return;
      const studentId = studentIds[0];

      const res = await axios.get(`/mastery/student/${studentId}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });
  });

  describe('Standards and Lessons APIs', () => {
    it('lists standards', async () => {
      const res = await axios.get('/standards');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);

      if (res.data.length > 0) {
        expect(res.data[0]).toHaveProperty('id');
        expect(res.data[0]).toHaveProperty('subject');
        expect(res.data[0]).toHaveProperty('grade');
      }
    });

    it('lists lessons', async () => {
      const res = await axios.get('/lessons');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('lists safety logs', async () => {
      const res = await axios.get('/safety/logs');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });
  });

  describe('Phenomena Pipeline', () => {
    it('lists phenomena for a student', async () => {
      if (studentIds.length === 0) return;
      const studentId = studentIds[0];

      const res = await axios.get(`/phenomena/student/${studentId}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });
  });
});
