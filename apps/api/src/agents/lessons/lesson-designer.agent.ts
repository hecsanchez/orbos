import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { standards, lessonScripts } from '../../db/schema';
import { LLMClient } from '../../llm/llm-client';
import { PromptTemplateService } from '../../llm/prompt-template.service';
import { EmbeddingsService } from '../../rag/embeddings.service';
import { InteractionValidatorService } from '../../interactions/interaction-validator.service';
import { SafetyAgent } from '../safety/safety.agent';

export interface LessonGenerateInput {
  standard_id: string;
  student_age: number;
  allowed_components?: string[];
}

const DEFAULT_COMPONENTS = [
  'story_card',
  'tap_reveal',
  'drag_drop',
  'multiple_choice',
  'ordering',
  'build_object',
  'slider',
  'match_connect',
  'audio_explain',
  'confidence_check',
];

@Injectable()
export class LessonDesignerAgent {
  private readonly logger = new Logger(LessonDesignerAgent.name);

  constructor(
    private readonly llm: LLMClient,
    private readonly promptService: PromptTemplateService,
    private readonly embeddings: EmbeddingsService,
    private readonly validator: InteractionValidatorService,
    private readonly safetyAgent: SafetyAgent,
  ) {}

  async generate(input: LessonGenerateInput): Promise<{
    id: string;
    standard_id: string;
    script: unknown[];
    safety_approved: boolean;
    admin_approved: boolean;
  }> {
    // 1. Retrieve standard from DB
    const [standard] = await db
      .select()
      .from(standards)
      .where(eq(standards.id, input.standard_id))
      .limit(1);

    if (!standard) {
      throw new NotFoundException(
        `Standard "${input.standard_id}" not found`,
      );
    }

    // 2. Find related standards via RAG
    const relatedStandards = await this.embeddings.search(
      `${standard.subject} Grado ${standard.grade}: ${standard.description}`,
      3,
    );

    const relatedContext = relatedStandards
      .filter((s) => s.id !== input.standard_id)
      .slice(0, 2)
      .map((s) => `${s.id}: ${s.description}`)
      .join('\n');

    // 3. Build prompt from DB template
    const allowedComponents =
      input.allowed_components ?? DEFAULT_COMPONENTS;

    const componentSchemas =
      this.validator.getSchemaReference(allowedComponents);

    const template = await this.promptService.getTemplate('lesson_generator');
    const prompt = this.promptService.render(template, {
      standard_description: standard.description,
      grade: String(standard.grade),
      student_age: String(input.student_age),
      related_standards: relatedContext || 'None',
      allowed_components: allowedComponents.join(', '),
      component_schemas: componentSchemas,
    });

    // 4. Generate script with LLM (retry parse once)
    let script = await this.generateScript(prompt);

    // 5. Run through safety validation with regeneration
    const regenerate = async () => {
      this.logger.log('Regenerating script after safety failure...');
      return this.generateScript(prompt);
    };

    const { script: safeScript, result: safetyResult } =
      await this.safetyAgent.validateWithRegeneration(script, regenerate);

    // 6. Save to DB
    const [saved] = await db
      .insert(lessonScripts)
      .values({
        standardId: input.standard_id,
        studentAgeTarget: input.student_age,
        scriptJson: safeScript,
        safetyApproved: true,
      })
      .returning({ id: lessonScripts.id });

    this.logger.log(
      `Lesson script ${saved.id} created for ${input.standard_id} ` +
        `(safety attempts: ${safetyResult.attempt_number})`,
    );

    return {
      id: saved.id,
      standard_id: input.standard_id,
      script: safeScript,
      safety_approved: true,
      admin_approved: false,
    };
  }

  private async generateScript(prompt: string): Promise<unknown[]> {
    const response = await this.llm.generate(
      [
        {
          role: 'system',
          content:
            'You are an expert curriculum designer for Mexican primary school children. ' +
            'Return ONLY a valid JSON array. No explanation, no markdown fences.',
        },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.7, maxTokens: 2048 },
    );

    // Try to parse, retry once on failure
    try {
      return this.parseScript(response);
    } catch {
      this.logger.warn('First parse failed, retrying generation...');
      const retryResponse = await this.llm.generate(
        [
          {
            role: 'system',
            content:
              'You are an expert curriculum designer for Mexican primary school children. ' +
              'Return ONLY a valid JSON array. No explanation, no markdown fences.',
          },
          { role: 'user', content: prompt },
          { role: 'assistant', content: response },
          {
            role: 'user',
            content:
              'That was not valid JSON. Please return ONLY a JSON array, nothing else.',
          },
        ],
        { temperature: 0.3, maxTokens: 2048 },
      );
      return this.parseScript(retryResponse);
    }
  }

  private parseScript(response: string): unknown[] {
    // Strip markdown fences if present
    let cleaned = response.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) {
      throw new Error('LLM response is not a JSON array');
    }
    return parsed;
  }
}
