import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SafetyAgent, SafetyError } from './safety.agent';

// ── Mocks ────────────────────────────────────────────

const mockValidator = {
  validateScript: vi.fn(),
};

const mockLLM = {
  generate: vi.fn(),
};

const mockPromptService = {
  getTemplate: vi.fn(),
  render: vi.fn(),
};

// Mock the db module
vi.mock('../../db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

// ── Helpers ──────────────────────────────────────────

function validScript() {
  return [
    {
      component: 'story_card',
      props: {
        title: 'Los números',
        body: 'Vamos a aprender a contar.',
        tts_text: 'Hola amigos, vamos a aprender a contar juntos.',
      },
      tts_text: 'Hola amigos, vamos a aprender a contar juntos.',
    },
    {
      component: 'confidence_check',
      props: {
        question: '¿Entendiste?',
        tts_text: '¿Qué tanto entendiste la lección?',
      },
      tts_text: '¿Qué tanto entendiste la lección?',
    },
  ];
}

// ── Tests ────────────────────────────────────────────

describe('SafetyAgent', () => {
  let agent: SafetyAgent;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new SafetyAgent(
      mockValidator as any,
      mockLLM as any,
      mockPromptService as any,
    );
  });

  it('passes a valid script', async () => {
    mockValidator.validateScript.mockReturnValue({ valid: true, errors: [] });
    mockPromptService.getTemplate.mockResolvedValue('template {{script_json}} {{age}}');
    mockPromptService.render.mockReturnValue('rendered prompt');
    mockLLM.generate.mockResolvedValue(JSON.stringify({ passed: true, flags: [] }));

    const result = await agent.checkScript(validScript());

    expect(result.passed).toBe(true);
    expect(result.flags).toHaveLength(0);
  });

  it('rejects unknown component without LLM call', async () => {
    const script = [
      {
        component: 'video_player',
        props: { url: 'http://example.com' },
        tts_text: 'Watch this video.',
      },
    ];

    mockValidator.validateScript.mockReturnValue({
      valid: false,
      errors: ['[0] Unknown component: "video_player"'],
    });

    const result = await agent.checkScript(script);

    expect(result.passed).toBe(false);
    expect(result.flags).toContain('[0] Unknown component: "video_player"');
    // LLM should NOT have been called since rule-based checks failed
    expect(mockLLM.generate).not.toHaveBeenCalled();
  });

  it('catches word limit exceeded', async () => {
    const longText = Array(85).fill('palabra').join(' ');
    const script = [
      {
        component: 'story_card',
        props: {
          title: 'Test',
          body: 'Body text',
          tts_text: longText,
        },
        tts_text: longText,
      },
    ];

    // Validator passes (component is valid), but our word-limit check catches it
    mockValidator.validateScript.mockReturnValue({ valid: true, errors: [] });

    const result = await agent.checkScript(script);

    expect(result.passed).toBe(false);
    expect(result.flags.some((f: string) => f.includes('word limit'))).toBe(true);
  });

  it('catches missing tts_text', async () => {
    const script = [
      {
        component: 'story_card',
        props: { title: 'Test', body: 'Body' },
      },
    ];

    mockValidator.validateScript.mockReturnValue({ valid: true, errors: [] });

    const result = await agent.checkScript(script);

    expect(result.passed).toBe(false);
    expect(result.flags.some((f: string) => f.includes('Missing tts_text'))).toBe(true);
  });

  it('catches URLs in text fields', async () => {
    const script = [
      {
        component: 'story_card',
        props: {
          title: 'Visit https://example.com',
          body: 'Body text',
          tts_text: 'Visit our website.',
        },
        tts_text: 'Visit our website.',
      },
    ];

    mockValidator.validateScript.mockReturnValue({ valid: true, errors: [] });

    const result = await agent.checkScript(script);

    expect(result.passed).toBe(false);
    expect(result.flags.some((f: string) => f.includes('URL'))).toBe(true);
  });

  it('catches email patterns in text fields', async () => {
    const script = [
      {
        component: 'story_card',
        props: {
          title: 'Contact test@example.com',
          body: 'Body text',
          tts_text: 'Contact us.',
        },
        tts_text: 'Contact us.',
      },
    ];

    mockValidator.validateScript.mockReturnValue({ valid: true, errors: [] });

    const result = await agent.checkScript(script);

    expect(result.passed).toBe(false);
    expect(result.flags.some((f: string) => f.includes('email'))).toBe(true);
  });

  it('regeneration loop works up to 3 attempts', async () => {
    let callCount = 0;
    mockValidator.validateScript.mockReturnValue({ valid: true, errors: [] });
    mockPromptService.getTemplate.mockResolvedValue('template');
    mockPromptService.render.mockReturnValue('rendered');

    // First two attempts fail via LLM, third passes
    mockLLM.generate
      .mockResolvedValueOnce(JSON.stringify({ passed: false, flags: ['inappropriate content'] }))
      .mockResolvedValueOnce(JSON.stringify({ passed: false, flags: ['inappropriate content'] }))
      .mockResolvedValueOnce(JSON.stringify({ passed: true, flags: [] }));

    const regenerate = vi.fn().mockImplementation(async () => {
      callCount++;
      return validScript();
    });

    const { script, result } = await agent.validateWithRegeneration(
      validScript(),
      regenerate,
    );

    expect(result.passed).toBe(true);
    expect(regenerate).toHaveBeenCalledTimes(2); // two regenerations before 3rd attempt passes
    expect(script).toBeDefined();
  });

  it('throws SafetyError after 3 failed attempts', async () => {
    mockValidator.validateScript.mockReturnValue({ valid: true, errors: [] });
    mockPromptService.getTemplate.mockResolvedValue('template');
    mockPromptService.render.mockReturnValue('rendered');

    // All attempts fail
    mockLLM.generate.mockResolvedValue(
      JSON.stringify({ passed: false, flags: ['unsafe content'] }),
    );

    const regenerate = vi.fn().mockResolvedValue(validScript());

    await expect(
      agent.validateWithRegeneration(validScript(), regenerate),
    ).rejects.toThrow(SafetyError);

    await expect(
      agent.validateWithRegeneration(validScript(), regenerate),
    ).rejects.toThrow(/Safety check failed after 3 attempts/);
  });
});
