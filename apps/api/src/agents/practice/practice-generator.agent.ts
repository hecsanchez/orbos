import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { standards, lessonScripts } from '../../db/schema';
import { LLMClient } from '../../llm/llm-client';
import { PromptTemplateService } from '../../llm/prompt-template.service';
import { InteractionValidatorService } from '../../interactions/interaction-validator.service';
import { SafetyAgent } from '../safety/safety.agent';

export interface PracticeGenerateInput {
  standard_id: string;
  mastery_level: number;
  student_age: number;
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
export class PracticeGeneratorAgent {
  private readonly logger = new Logger(PracticeGeneratorAgent.name);

  constructor(
    private readonly llm: LLMClient,
    private readonly promptService: PromptTemplateService,
    private readonly validator: InteractionValidatorService,
    private readonly safetyAgent: SafetyAgent,
  ) {}

  async generate(input: PracticeGenerateInput): Promise<{
    id: string;
    standard_id: string;
    script: unknown[];
    safety_approved: boolean;
    admin_approved: boolean;
  }> {
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

    let difficultyHint: string;
    if (input.mastery_level < 0.5) {
      difficultyHint =
        'The student is struggling. Use simpler questions, more story_card reinforcement, and encouraging language.';
    } else if (input.mastery_level <= 0.8) {
      difficultyHint =
        'The student has moderate understanding. Use mixed difficulty with some challenging questions.';
    } else {
      difficultyHint =
        'The student has strong understanding. Use challenge questions with less scaffolding. Minimize story_card usage.';
    }

    const componentSchemas = this.validator.getSchemaReference(DEFAULT_COMPONENTS);

    const template = await this.promptService.getTemplate('practice_generator');
    const prompt = this.promptService.render(template, {
      standard_description: standard.description,
      grade: String(standard.grade),
      student_age: String(input.student_age),
      mastery_level: String(input.mastery_level),
      difficulty_hint: difficultyHint,
      allowed_components: DEFAULT_COMPONENTS.join(', '),
      component_schemas: componentSchemas,
    });

    let script = await this.generateScript(prompt);

    const regenerate = async () => {
      this.logger.log('Regenerating practice script after safety failure...');
      return this.generateScript(prompt);
    };

    const { script: safeScript } =
      await this.safetyAgent.validateWithRegeneration(script, regenerate);

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
      `Practice script ${saved.id} created for ${input.standard_id} (mastery: ${input.mastery_level})`,
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
            'Generate practice exercises adapted to the student mastery level. ' +
            'Return ONLY a valid JSON array. No explanation, no markdown fences.',
        },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.7, maxTokens: 2048 },
    );

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
