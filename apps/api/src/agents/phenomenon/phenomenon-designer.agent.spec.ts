import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PhenomenonDesignerAgent } from './phenomenon-designer.agent';
import type { PhenomenonProposal } from '../../phenomena/schemas/phenomenon-proposal.schema';

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

const mockSafetyAgent = {
  checkPhenomenon: vi.fn(),
};

// Mock db module
vi.mock('../../db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn(),
        }),
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn(),
          }),
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

function validProposal(overrides?: Partial<PhenomenonProposal>): PhenomenonProposal {
  return {
    title: 'El ciclo del agua en tu cocina',
    description:
      'Observa cómo el agua hierve, se evapora y se condensa en la tapa de la olla.',
    duration_days: 3,
    linked_standards: ['SEP-CIE-2-3.1'],
    facilitation_guide: {
      overview: 'Exploración del ciclo del agua usando materiales de cocina.',
      duration_days: 3,
      daily_steps: [
        {
          day: 1,
          title: 'Observar',
          instructions: 'Hervir agua y observar el vapor.',
          discussion_prompts: ['¿De dónde viene el vapor?'],
        },
        {
          day: 2,
          title: 'Experimentar',
          instructions: 'Poner tapa fría sobre el vapor.',
          discussion_prompts: ['¿Qué aparece en la tapa?'],
        },
        {
          day: 3,
          title: 'Concluir',
          instructions: 'Dibujar el ciclo observado.',
          discussion_prompts: ['¿Cómo se parece a la lluvia?'],
        },
      ],
      materials_needed: ['Olla', 'Agua', 'Tapa metálica', 'Cuaderno'],
      success_indicators: ['Describe evaporación', 'Identifica condensación'],
    },
    evidence_prompt: {
      instruction_text: 'Toma una foto del vapor y las gotas en la tapa.',
      tts_text: 'Ahora toma una foto del vapor y las gotitas en la tapa.',
      capture_type: 'photo',
    },
    ...overrides,
  };
}

function threeValidProposals(): PhenomenonProposal[] {
  return [
    validProposal(),
    validProposal({
      title: 'Las sombras cambiantes',
      linked_standards: ['SEP-CIE-2-2.1'],
    }),
    validProposal({
      title: 'Plantas y luz',
      linked_standards: ['SEP-CIE-2-1.1'],
    }),
  ];
}

const fakeStudent = {
  id: 'aaaa-bbbb-cccc-dddd',
  name: 'Sofía',
  age: 7,
  gradeTarget: 2,
  interests: ['animales', 'cocina'],
};

// ── Tests ────────────────────────────────────────────

describe('PhenomenonDesignerAgent', () => {
  let agent: PhenomenonDesignerAgent;

  beforeEach(async () => {
    vi.clearAllMocks();

    const { db } = await import('../../db');

    // Student select chain
    const mockStudentLimit = vi.fn().mockResolvedValue([fakeStudent]);
    const mockStudentWhere = vi.fn().mockReturnValue({ limit: mockStudentLimit });
    const mockStudentFrom = vi.fn().mockReturnValue({ where: mockStudentWhere });

    // Mastery select chain (innerJoin)
    const mockMasteryLimit = vi.fn().mockResolvedValue([
      {
        standardId: 'SEP-CIE-2-3.1',
        masteryLevel: 0.4,
        description: 'Ciclo del agua',
        subject: 'Ciencias',
        grade: 2,
      },
    ]);
    const mockMasteryWhere = vi.fn().mockReturnValue({ limit: mockMasteryLimit });
    const mockMasteryJoin = vi.fn().mockReturnValue({ where: mockMasteryWhere });
    const mockMasteryFrom = vi.fn().mockReturnValue({ innerJoin: mockMasteryJoin });

    let selectCallCount = 0;
    (db.select as any).mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        return { from: mockStudentFrom };
      }
      return { from: mockMasteryFrom };
    });

    // Insert chain
    const mockReturning = vi
      .fn()
      .mockResolvedValueOnce([{ id: 'p1' }])
      .mockResolvedValueOnce([{ id: 'p2' }])
      .mockResolvedValueOnce([{ id: 'p3' }]);
    const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
    (db.insert as any).mockReturnValue({ values: mockValues });

    // Default mock behaviors
    mockEmbeddings.search.mockResolvedValue([
      { id: 'SEP-CIE-2-2.1', subject: 'Ciencias', description: 'Related standard' },
    ]);
    mockPromptService.getTemplate.mockResolvedValue('template {{student_name}}');
    mockPromptService.render.mockReturnValue('rendered prompt');

    const proposals = threeValidProposals();
    mockLLM.generate.mockResolvedValue(JSON.stringify(proposals));

    mockSafetyAgent.checkPhenomenon.mockResolvedValue({
      passed: true,
      flags: [],
      attempt_number: 1,
      regenerated: false,
    });

    agent = new PhenomenonDesignerAgent(
      mockLLM as any,
      mockPromptService as any,
      mockEmbeddings as any,
      mockSafetyAgent as any,
    );
  });

  it('generates 3 valid proposals and inserts them into DB', async () => {
    const results = await agent.propose(fakeStudent.id);

    expect(results).toHaveLength(3);
    expect(results[0].status).toBe('pending');
    expect(results[0].student_id).toBe(fakeStudent.id);
    expect(results[0].approved_by).toBeNull();

    const { db } = await import('../../db');
    expect(db.insert).toHaveBeenCalledTimes(3);
  });

  it('throws NotFoundException for unknown student', async () => {
    const { db } = await import('../../db');

    const mockLimit = vi.fn().mockResolvedValue([]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    (db.select as any).mockReturnValue({ from: mockFrom });

    await expect(agent.propose('nonexistent')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('retries generation when safety check fails', async () => {
    mockSafetyAgent.checkPhenomenon
      .mockResolvedValueOnce({
        passed: false,
        flags: ['Unsafe content'],
        attempt_number: 1,
        regenerated: false,
      })
      .mockResolvedValueOnce({
        passed: true,
        flags: [],
        attempt_number: 2,
        regenerated: false,
      })
      .mockResolvedValueOnce({
        passed: true,
        flags: [],
        attempt_number: 2,
        regenerated: false,
      })
      .mockResolvedValueOnce({
        passed: true,
        flags: [],
        attempt_number: 2,
        regenerated: false,
      });

    const results = await agent.propose(fakeStudent.id);
    expect(results).toHaveLength(3);
    expect(mockLLM.generate).toHaveBeenCalledTimes(2);
  });

  it('retries on validation errors then succeeds', async () => {
    const invalidProposals = [{ title: '' }]; // Missing required fields
    const validProposals = threeValidProposals();

    mockLLM.generate
      .mockResolvedValueOnce(JSON.stringify(invalidProposals))
      .mockResolvedValueOnce(JSON.stringify(validProposals));

    const results = await agent.propose(fakeStudent.id);
    expect(results).toHaveLength(3);
    expect(mockLLM.generate).toHaveBeenCalledTimes(2);
  });
});
