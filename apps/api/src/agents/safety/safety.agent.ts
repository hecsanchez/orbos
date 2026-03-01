import { Injectable, Logger } from '@nestjs/common';
import { db } from '../../db';
import { safetyLogs } from '../../db/schema';
import { InteractionValidatorService } from '../../interactions/interaction-validator.service';
import { LLMClient } from '../../llm/llm-client';
import { PromptTemplateService } from '../../llm/prompt-template.service';

export interface SafetyCheckResult {
  passed: boolean;
  flags: string[];
  attempt_number: number;
  regenerated: boolean;
}

export class SafetyError extends Error {
  constructor(
    message: string,
    public readonly flags: string[],
  ) {
    super(message);
    this.name = 'SafetyError';
  }
}

const MAX_WORDS_PER_TTS = 80;
const URL_REGEX = /https?:\/\/|www\.|\.com|\.org|\.net|\.mx|\.edu/i;
const EMAIL_REGEX = /[\w.-]+@[\w.-]+\.\w+/;
const PHONE_REGEX = /\b\d{3}[-.]?\d{3,4}[-.]?\d{4}\b/;

@Injectable()
export class SafetyAgent {
  private readonly logger = new Logger(SafetyAgent.name);

  constructor(
    private readonly validator: InteractionValidatorService,
    private readonly llm: LLMClient,
    private readonly promptService: PromptTemplateService,
  ) {}

  async checkScript(
    script: unknown[],
    attemptNumber = 1,
  ): Promise<SafetyCheckResult> {
    const flags: string[] = [];

    // ── Rule-based checks (fast, deterministic) ──────
    const validationResult = this.validator.validateScript(script);
    if (!validationResult.valid) {
      flags.push(...validationResult.errors);
    }

    // Check word limits and required tts_text
    for (let i = 0; i < script.length; i++) {
      const block = script[i] as Record<string, unknown>;
      const props = (block.props ?? {}) as Record<string, unknown>;
      const ttsText = (props.tts_text ?? block.tts_text) as string | undefined;

      if (!ttsText && block.component !== 'confidence_check') {
        flags.push(`[${i}] Missing tts_text`);
      }

      if (ttsText) {
        const wordCount = ttsText.trim().split(/\s+/).length;
        if (wordCount > MAX_WORDS_PER_TTS) {
          flags.push(
            `[${i}] tts_text exceeds ${MAX_WORDS_PER_TTS} word limit (got ${wordCount})`,
          );
        }
      }

      // Check all text fields for URLs, emails, phone numbers
      const textFields = this.extractTextFields(block);
      for (const text of textFields) {
        if (URL_REGEX.test(text)) {
          flags.push(`[${i}] Contains URL or domain name`);
        }
        if (EMAIL_REGEX.test(text)) {
          flags.push(`[${i}] Contains email address pattern`);
        }
        if (PHONE_REGEX.test(text)) {
          flags.push(`[${i}] Contains phone number pattern`);
        }
      }
    }

    // If rule-based checks failed, skip LLM check
    if (flags.length > 0) {
      const result: SafetyCheckResult = {
        passed: false,
        flags,
        attempt_number: attemptNumber,
        regenerated: false,
      };
      await this.logCheck('script', null, result);
      return result;
    }

    // ── LLM-based checks ──────────────────────────────
    const llmFlags = await this.runLLMCheck(script);
    flags.push(...llmFlags);

    const result: SafetyCheckResult = {
      passed: flags.length === 0,
      flags,
      attempt_number: attemptNumber,
      regenerated: false,
    };
    await this.logCheck('script', null, result);
    return result;
  }

  async checkPhenomenon(
    proposal: { title: string; facilitation_guide: unknown },
    attemptNumber = 1,
  ): Promise<SafetyCheckResult> {
    const flags: string[] = [];
    const textFields = this.extractTextFields(proposal);

    for (const text of textFields) {
      if (URL_REGEX.test(text)) flags.push('Contains URL or domain name');
      if (EMAIL_REGEX.test(text)) flags.push('Contains email address pattern');
      if (PHONE_REGEX.test(text)) flags.push('Contains phone number pattern');
    }

    if (flags.length === 0) {
      const llmFlags = await this.runLLMCheck(proposal);
      flags.push(...llmFlags);
    }

    const result: SafetyCheckResult = {
      passed: flags.length === 0,
      flags,
      attempt_number: attemptNumber,
      regenerated: false,
    };
    await this.logCheck('phenomenon', null, result);
    return result;
  }

  async validateWithRegeneration(
    script: unknown[],
    regenerate: () => Promise<unknown[]>,
  ): Promise<{ script: unknown[]; result: SafetyCheckResult }> {
    let currentScript = script;

    for (let attempt = 1; attempt <= 3; attempt++) {
      const result = await this.checkScript(currentScript, attempt);

      if (result.passed) {
        return { script: currentScript, result };
      }

      this.logger.warn(
        `Safety check failed (attempt ${attempt}/3): ${result.flags.join(', ')}`,
      );

      if (attempt < 3) {
        currentScript = await regenerate();
        result.regenerated = true;
      }
    }

    // After 3 failed attempts
    const finalResult = await this.checkScript(currentScript, 3);
    throw new SafetyError(
      `Safety check failed after 3 attempts: ${finalResult.flags.join(', ')}`,
      finalResult.flags,
    );
  }

  private async runLLMCheck(content: unknown): Promise<string[]> {
    try {
      const template = await this.promptService.getTemplate('safety_checker');
      const prompt = this.promptService.render(template, {
        script_json: JSON.stringify(content, null, 2),
        age: '6',
      });

      const response = await this.llm.generate(
        [
          {
            role: 'system',
            content:
              'You are a safety reviewer for children\'s educational content. ' +
              'Respond with a JSON object: {"passed": true/false, "flags": ["issue1", "issue2"]}. ' +
              'Only flag genuine safety concerns. An empty flags array means the content is safe.',
          },
          { role: 'user', content: prompt },
        ],
        { temperature: 0.1, maxTokens: 512 },
      );

      const parsed = JSON.parse(response);
      if (
        parsed &&
        typeof parsed.passed === 'boolean' &&
        Array.isArray(parsed.flags)
      ) {
        return parsed.passed ? [] : parsed.flags;
      }
      return [];
    } catch (error) {
      this.logger.warn('LLM safety check failed, passing by default:', error);
      return [];
    }
  }

  private extractTextFields(obj: unknown): string[] {
    const texts: string[] = [];
    if (typeof obj === 'string') {
      texts.push(obj);
    } else if (Array.isArray(obj)) {
      for (const item of obj) {
        texts.push(...this.extractTextFields(item));
      }
    } else if (obj && typeof obj === 'object') {
      for (const value of Object.values(obj)) {
        texts.push(...this.extractTextFields(value));
      }
    }
    return texts;
  }

  private async logCheck(
    contentType: string,
    contentId: string | null,
    result: SafetyCheckResult,
  ): Promise<void> {
    try {
      await db.insert(safetyLogs).values({
        contentType,
        contentId,
        passed: result.passed,
        flags: result.flags,
        attemptNumber: result.attempt_number,
      });
    } catch (error) {
      this.logger.error('Failed to log safety check:', error);
    }
  }
}
