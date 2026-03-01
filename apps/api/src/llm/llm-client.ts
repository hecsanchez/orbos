import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export type LLMProvider = 'anthropic' | 'openai';

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  provider?: LLMProvider;
}

@Injectable()
export class LLMClient {
  private readonly defaultProvider: LLMProvider;
  private readonly defaultModel: string;
  private anthropic: Anthropic | null = null;
  private openai: OpenAI | null = null;

  constructor() {
    const envProvider = process.env.LLM_PROVIDER;
    this.defaultProvider =
      envProvider === 'openai' ? 'openai' : 'anthropic';
    this.defaultModel =
      process.env.LLM_MODEL ??
      (this.defaultProvider === 'anthropic'
        ? 'claude-sonnet-4-5'
        : 'gpt-4o');
  }

  private getAnthropic(): Anthropic {
    if (!this.anthropic) {
      this.anthropic = new Anthropic();
    }
    return this.anthropic;
  }

  private getOpenAI(): OpenAI {
    if (!this.openai) {
      this.openai = new OpenAI();
    }
    return this.openai;
  }

  async generate(
    messages: LLMMessage[],
    options?: LLMOptions,
  ): Promise<string> {
    const provider = options?.provider ?? this.defaultProvider;
    const model = options?.model ?? this.defaultModel;
    const maxTokens = options?.maxTokens ?? 1024;
    const temperature = options?.temperature ?? 0.7;

    if (provider === 'anthropic') {
      return this.generateAnthropic(messages, model, maxTokens, temperature);
    }
    return this.generateOpenAI(messages, model, maxTokens, temperature);
  }

  private async generateAnthropic(
    messages: LLMMessage[],
    model: string,
    maxTokens: number,
    temperature: number,
  ): Promise<string> {
    const client = this.getAnthropic();

    const systemMessages = messages.filter((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemMessages.map((m) => m.content).join('\n') || undefined,
      messages: nonSystemMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    return textBlock?.text ?? '';
  }

  private async generateOpenAI(
    messages: LLMMessage[],
    model: string,
    maxTokens: number,
    temperature: number,
  ): Promise<string> {
    const client = this.getOpenAI();

    const response = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    return response.choices[0]?.message?.content ?? '';
  }
}
