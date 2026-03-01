import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMClient, LLMMessage } from './llm-client';

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Hello from Anthropic' }],
        }),
      };
    },
  };
});

vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: 'Hello from OpenAI' } }],
          }),
        },
      };
    },
  };
});

describe('LLMClient', () => {
  const messages: LLMMessage[] = [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hi' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.LLM_PROVIDER;
    delete process.env.LLM_MODEL;
  });

  it('defaults to anthropic provider', async () => {
    const client = new LLMClient();
    const result = await client.generate(messages);
    expect(typeof result).toBe('string');
    expect(result).toBe('Hello from Anthropic');
  });

  it('uses openai when provider is set to openai', async () => {
    process.env.LLM_PROVIDER = 'openai';
    const client = new LLMClient();
    const result = await client.generate(messages);
    expect(typeof result).toBe('string');
    expect(result).toBe('Hello from OpenAI');
  });

  it('uses openai when overridden via options', async () => {
    const client = new LLMClient();
    const result = await client.generate(messages, { provider: 'openai' });
    expect(typeof result).toBe('string');
    expect(result).toBe('Hello from OpenAI');
  });

  it('uses anthropic when overridden via options', async () => {
    process.env.LLM_PROVIDER = 'openai';
    const client = new LLMClient();
    const result = await client.generate(messages, { provider: 'anthropic' });
    expect(typeof result).toBe('string');
    expect(result).toBe('Hello from Anthropic');
  });

  it('returns a plain string, never SDK types', async () => {
    const client = new LLMClient();
    const result = await client.generate(messages);
    expect(typeof result).toBe('string');
    expect(result).not.toBeInstanceOf(Object);
  });
});
