import { describe, it, expect, beforeAll } from 'vitest';
import { InteractionValidatorService } from './interaction-validator.service';

describe('InteractionValidatorService', () => {
  let validator: InteractionValidatorService;

  beforeAll(() => {
    validator = new InteractionValidatorService();
  });

  it('validates a correct story_card interaction', () => {
    const result = validator.validate({
      component: 'story_card',
      props: {
        title: 'Hello World',
        body: 'This is a story about numbers.',
        tts_text: 'This is a story about numbers.',
      },
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validates a correct multiple_choice interaction', () => {
    const result = validator.validate({
      component: 'multiple_choice',
      props: {
        question: 'What is 2 + 2?',
        tts_text: 'What is two plus two?',
        options: ['3', '4', '5'],
        correct_index: 1,
      },
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects an unknown component name', () => {
    const result = validator.validate({
      component: 'video_player',
      props: { url: 'http://example.com' },
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Unknown component: "video_player"');
  });

  it('rejects missing required props', () => {
    const result = validator.validate({
      component: 'story_card',
      props: {
        title: 'Hello',
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Missing required prop "body" for component "story_card"',
    );
    expect(result.errors).toContain(
      'Missing required prop "tts_text" for component "story_card"',
    );
  });

  it('rejects props exceeding maxLength', () => {
    const result = validator.validate({
      component: 'story_card',
      props: {
        title: 'A'.repeat(61),
        body: 'Short body',
        tts_text: 'Short tts',
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('exceeds maxLength 60');
  });

  it('validates a full script array', () => {
    const result = validator.validateScript([
      {
        component: 'story_card',
        props: {
          title: 'Intro',
          body: 'Welcome!',
          tts_text: 'Welcome to the lesson.',
        },
      },
      {
        component: 'multiple_choice',
        props: {
          question: 'Pick one',
          tts_text: 'Pick one of the following',
          options: ['A', 'B'],
          correct_index: 0,
        },
      },
    ]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects a script with an invalid interaction', () => {
    const result = validator.validateScript([
      {
        component: 'story_card',
        props: {
          title: 'Valid',
          body: 'Valid body',
          tts_text: 'Valid tts',
        },
      },
      {
        component: 'fake_component',
        props: {},
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Unknown component: "fake_component"');
  });
});
