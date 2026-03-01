import { describe, it, expect, beforeEach } from 'vitest';
import { MasteryEstimatorAgent } from './mastery-estimator.agent';
import type { AttemptInput } from './mastery-estimator.agent';

describe('MasteryEstimatorAgent', () => {
  let agent: MasteryEstimatorAgent;

  beforeEach(() => {
    agent = new MasteryEstimatorAgent();
  });

  function makeAttempt(overrides: Partial<AttemptInput> = {}): AttemptInput {
    return {
      correct: true,
      hint_used: false,
      time_spent_seconds: 15,
      source: 'lesson',
      ...overrides,
    };
  }

  it('returns 0.0 mastery with no attempts', () => {
    const result = agent.computeScore([]);
    expect(result.mastery_level).toBe(0.0);
    expect(result.recommendation).toBe('reteach');
  });

  it('correct answer with no hint scores 1.0', () => {
    const result = agent.computeScore([
      makeAttempt({ correct: true, hint_used: false }),
    ]);
    expect(result.mastery_level).toBe(1.0);
  });

  it('correct answer with hint scores 0.7', () => {
    const result = agent.computeScore([
      makeAttempt({ correct: true, hint_used: true }),
    ]);
    expect(result.mastery_level).toBe(0.7);
  });

  it('incorrect answer scores 0.0', () => {
    const result = agent.computeScore([
      makeAttempt({ correct: false, hint_used: false }),
    ]);
    expect(result.mastery_level).toBe(0.0);
  });

  it('phenomenon source applies 0.8 weight', () => {
    const result = agent.computeScore([
      makeAttempt({ correct: true, hint_used: false, source: 'phenomenon' }),
    ]);
    expect(result.mastery_level).toBe(0.8);
  });

  it('fast correct answer applies speed bonus', () => {
    const result = agent.computeScore([
      makeAttempt({ correct: true, hint_used: false, time_spent_seconds: 5 }),
    ]);
    // (1.0 - 0.0 + 0.1) * 1.0 = 1.1 → clamped to 1.0
    expect(result.mastery_level).toBe(1.0);
  });

  it('recommendation is advance when mastery >= 0.8 with direct lesson attempt', () => {
    const result = agent.computeScore([
      makeAttempt({ correct: true, source: 'lesson' }),
    ]);
    expect(result.mastery_level).toBeGreaterThanOrEqual(0.8);
    expect(result.has_direct_lesson_attempt).toBe(true);
    expect(result.recommendation).toBe('advance');
  });

  it('recommendation is practice when mastery >= 0.8 without direct lesson attempt', () => {
    const result = agent.computeScore([
      makeAttempt({ correct: true, source: 'phenomenon' }),
    ]);
    expect(result.mastery_level).toBeGreaterThanOrEqual(0.8);
    expect(result.has_direct_lesson_attempt).toBe(false);
    expect(result.recommendation).toBe('practice');
  });

  it('recommendation is reteach when mastery < 0.5', () => {
    const result = agent.computeScore([
      makeAttempt({ correct: false }),
      makeAttempt({ correct: false }),
      makeAttempt({ correct: false }),
    ]);
    expect(result.mastery_level).toBeLessThan(0.5);
    expect(result.recommendation).toBe('reteach');
  });

  it('recency bias weights recent attempts higher', () => {
    // Old attempts wrong, recent ones correct → mastery should be higher
    // than if recency bias were absent
    const recentCorrect = agent.computeScore([
      makeAttempt({ correct: false }),
      makeAttempt({ correct: false }),
      makeAttempt({ correct: true }),
      makeAttempt({ correct: true }),
    ]);

    // Old attempts correct, recent ones wrong → mastery should be lower
    const recentWrong = agent.computeScore([
      makeAttempt({ correct: true }),
      makeAttempt({ correct: true }),
      makeAttempt({ correct: false }),
      makeAttempt({ correct: false }),
    ]);

    expect(recentCorrect.mastery_level).toBeGreaterThan(recentWrong.mastery_level);
  });

  it('mastery is clamped to 1.0 maximum', () => {
    // Fast correct + lesson → (1.0 + 0.1) * 1.0 = 1.1
    const result = agent.computeScore([
      makeAttempt({ correct: true, time_spent_seconds: 3 }),
    ]);
    expect(result.mastery_level).toBeLessThanOrEqual(1.0);
  });

  it('mastery is clamped to 0.0 minimum', () => {
    // Even with negative scores (hint penalty on wrong answer), mastery stays >= 0
    const result = agent.computeScore([
      makeAttempt({ correct: false, hint_used: true }),
    ]);
    expect(result.mastery_level).toBeGreaterThanOrEqual(0.0);
  });
});
