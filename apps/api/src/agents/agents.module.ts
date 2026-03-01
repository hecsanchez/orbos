import { Module } from '@nestjs/common';
import { LLMClient } from '../llm/llm-client';
import { PromptTemplateService } from '../llm/prompt-template.service';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [RagModule],
  providers: [LLMClient, PromptTemplateService],
  exports: [LLMClient, PromptTemplateService],
})
export class AgentsModule {}
