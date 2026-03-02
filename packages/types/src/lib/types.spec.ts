import type { InteractionBlock, AttemptResult, PlanItemDto } from './types.js';

describe('types', () => {
  it('InteractionBlock interface should be usable', () => {
    const block: InteractionBlock = {
      component: 'story_card',
      props: { title: 'Test' },
      tts_text: 'Hola',
    };
    expect(block.component).toBe('story_card');
  });

  it('AttemptResult interface should be usable', () => {
    const result: AttemptResult = {
      component: 'multiple_choice',
      correct: true,
      hint_used: false,
      time_spent_seconds: 5,
    };
    expect(result.correct).toBe(true);
  });

  it('PlanItemDto should include all required fields', () => {
    const item: PlanItemDto = {
      standard_id: 'SEP-MAT-1-1.1',
      standard_description: 'Math',
      subject: 'Matematicas',
      grade: 1,
      type: 'lesson',
      estimated_minutes: 15,
    };
    expect(item.type).toBe('lesson');
  });
});
