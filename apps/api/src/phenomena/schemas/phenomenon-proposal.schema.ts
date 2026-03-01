import { z } from 'zod/v4';

export interface FacilitationGuide {
  overview: string;
  duration_days: number;
  daily_steps: {
    day: number;
    title: string;
    instructions: string;
    discussion_prompts: string[];
  }[];
  materials_needed: string[];
  success_indicators: string[];
}

export interface EvidencePrompt {
  instruction_text: string;
  tts_text: string;
  capture_type: 'audio' | 'photo' | 'both';
}

export interface PhenomenonProposal {
  title: string;
  description: string;
  duration_days: number;
  linked_standards: string[];
  facilitation_guide: FacilitationGuide;
  evidence_prompt: EvidencePrompt;
}

const dailyStepSchema = z.object({
  day: z.number().int().min(1),
  title: z.string().min(1),
  instructions: z.string().min(1),
  discussion_prompts: z.array(z.string()).min(1),
});

const facilitationGuideSchema = z.object({
  overview: z.string().min(1).max(500),
  duration_days: z.number().int().min(3).max(5),
  daily_steps: z.array(dailyStepSchema).min(1),
  materials_needed: z.array(z.string()),
  success_indicators: z.array(z.string()).min(1),
});

const evidencePromptSchema = z.object({
  instruction_text: z.string().min(1).max(400),
  tts_text: z.string().min(1).max(400),
  capture_type: z.enum(['audio', 'photo', 'both']),
});

export const phenomenonProposalSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1),
  duration_days: z.number().int().min(3).max(5),
  linked_standards: z.array(z.string()).min(1),
  facilitation_guide: facilitationGuideSchema,
  evidence_prompt: evidencePromptSchema,
});

export function validatePhenomenonProposal(data: unknown): {
  valid: boolean;
  errors: string[];
  data?: PhenomenonProposal;
} {
  const result = phenomenonProposalSchema.safeParse(data);
  if (result.success) {
    return { valid: true, errors: [], data: result.data as PhenomenonProposal };
  }
  return {
    valid: false,
    errors: result.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`,
    ),
  };
}
