import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { LessonDesignerAgent } from './lesson-designer.agent';

// ── Mocks ────────────────────────────────────────────

const mockLLM = {
  generate: vi.fn(),
};

const mockPromptService = {
  getTemplate: vi.fn(),
  render: vi.fn(),
};

const mockEmbeddings = {
  search: vi.fn(),
};

const mockValidator = {
  getSchemaReference: vi.fn().mockReturnValue('story_card:\n    title: string (REQUIRED)\n    body: string (REQUIRED)\n    tts_text: string (REQUIRED)'),
};

const mockSafetyAgent = {
  validateWithRegeneration: vi.fn(),
  checkScript: vi.fn(),
};

// Mock db module
const mockInsertValues = vi.fn();
const mockInsertReturning = vi.fn();

vi.mock('../../db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn(),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn(),
      }),
    }),
  },
}));

// ── Helpers ──────────────────────────────────────────

function validGeneratedScript() {
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
      component: 'multiple_choice',
      props: {
        question: '¿Cuánto es 2 + 3?',
        options: ['4', '5', '6'],
        correct_index: 1,
        tts_text: '¿Cuánto es dos más tres?',
      },
      tts_text: '¿Cuánto es dos más tres?',
    },
    {
      component: 'confidence_check',
      props: {
        question: '¿Qué tanto entendiste?',
        tts_text: '¿Qué tanto entendiste la lección?',
      },
      tts_text: '¿Qué tanto entendiste la lección?',
    },
  ];
}

const fakeStandard = {
  id: 'SEP-MAT-1-1.1',
  grade: 1,
  subject: 'Matematicas',
  topic: 'Números',
  description: 'Cuenta colecciones no mayores a 20 elementos.',
  prerequisites: [],
  embedding: null,
};

// ── Tests ────────────────────────────────────────────

describe('LessonDesignerAgent', () => {
  let agent: LessonDesignerAgent;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset the db mock chain for each test
    const { db } = await import('../../db');

    const mockLimit = vi.fn();
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    (db.select as any).mockReturnValue({ from: mockFrom });

    const mockReturning = vi.fn();
    const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
    (db.insert as any).mockReturnValue({ values: mockValues });

    // Store references for assertions
    mockInsertValues.mockImplementation(mockValues);
    mockInsertReturning.mockImplementation(mockReturning);

    // Default: standard exists
    mockLimit.mockResolvedValue([fakeStandard]);

    // Default: insert returns an id
    mockReturning.mockResolvedValue([{ id: '11111111-1111-1111-1111-111111111111' }]);

    agent = new LessonDesignerAgent(
      mockLLM as any,
      mockPromptService as any,
      mockEmbeddings as any,
      mockValidator as any,
      mockSafetyAgent as any,
    );
  });

  it('returns a script with at least 2 interactions', async () => {
    const script = validGeneratedScript();

    mockEmbeddings.search.mockResolvedValue([
      { id: 'SEP-MAT-1-1.2', description: 'Related standard' },
    ]);
    mockPromptService.getTemplate.mockResolvedValue('template');
    mockPromptService.render.mockReturnValue('rendered prompt');
    mockLLM.generate.mockResolvedValue(JSON.stringify(script));
    mockSafetyAgent.validateWithRegeneration.mockResolvedValue({
      script,
      result: { passed: true, flags: [], attempt_number: 1, regenerated: false },
    });

    const result = await agent.generate({
      standard_id: 'SEP-MAT-1-1.1',
      student_age: 6,
    });

    expect(result.script.length).toBeGreaterThanOrEqual(2);
    expect(result.safety_approved).toBe(true);
    expect(result.standard_id).toBe('SEP-MAT-1-1.1');
  });

  it('first interaction is always story_card', async () => {
    const script = validGeneratedScript();

    mockEmbeddings.search.mockResolvedValue([]);
    mockPromptService.getTemplate.mockResolvedValue('template');
    mockPromptService.render.mockReturnValue('rendered prompt');
    mockLLM.generate.mockResolvedValue(JSON.stringify(script));
    mockSafetyAgent.validateWithRegeneration.mockResolvedValue({
      script,
      result: { passed: true, flags: [], attempt_number: 1, regenerated: false },
    });

    const result = await agent.generate({
      standard_id: 'SEP-MAT-1-1.1',
      student_age: 6,
    });

    const firstBlock = result.script[0] as { component: string };
    expect(firstBlock.component).toBe('story_card');
  });

  it('last interaction is always confidence_check', async () => {
    const script = validGeneratedScript();

    mockEmbeddings.search.mockResolvedValue([]);
    mockPromptService.getTemplate.mockResolvedValue('template');
    mockPromptService.render.mockReturnValue('rendered prompt');
    mockLLM.generate.mockResolvedValue(JSON.stringify(script));
    mockSafetyAgent.validateWithRegeneration.mockResolvedValue({
      script,
      result: { passed: true, flags: [], attempt_number: 1, regenerated: false },
    });

    const result = await agent.generate({
      standard_id: 'SEP-MAT-1-1.1',
      student_age: 6,
    });

    const lastBlock = result.script[result.script.length - 1] as { component: string };
    expect(lastBlock.component).toBe('confidence_check');
  });

  it('throws NotFoundException for unknown standard_id', async () => {
    const { db } = await import('../../db');
    const mockLimit = vi.fn().mockResolvedValue([]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    (db.select as any).mockReturnValue({ from: mockFrom });

    await expect(
      agent.generate({ standard_id: 'FAKE-ID', student_age: 6 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('script is saved to DB after safety approval', async () => {
    const script = validGeneratedScript();
    const { db } = await import('../../db');

    mockEmbeddings.search.mockResolvedValue([]);
    mockPromptService.getTemplate.mockResolvedValue('template');
    mockPromptService.render.mockReturnValue('rendered prompt');
    mockLLM.generate.mockResolvedValue(JSON.stringify(script));
    mockSafetyAgent.validateWithRegeneration.mockResolvedValue({
      script,
      result: { passed: true, flags: [], attempt_number: 1, regenerated: false },
    });

    const result = await agent.generate({
      standard_id: 'SEP-MAT-1-1.1',
      student_age: 6,
    });

    expect(db.insert).toHaveBeenCalled();
    expect(result.id).toBe('11111111-1111-1111-1111-111111111111');
    expect(result.safety_approved).toBe(true);
  });
});
