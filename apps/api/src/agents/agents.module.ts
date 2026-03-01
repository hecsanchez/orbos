import { Module } from '@nestjs/common';
import { LLMClient } from '../llm/llm-client';
import { PromptTemplateService } from '../llm/prompt-template.service';
import { InteractionValidatorService } from '../interactions/interaction-validator.service';
import { RagModule } from '../rag/rag.module';
import { SafetyAgent } from './safety/safety.agent';
import { LessonDesignerAgent } from './lessons/lesson-designer.agent';

@Module({
  imports: [RagModule],
  providers: [
    LLMClient,
    PromptTemplateService,
    InteractionValidatorService,
    SafetyAgent,
    LessonDesignerAgent,
  ],
  exports: [
    LLMClient,
    PromptTemplateService,
    SafetyAgent,
    LessonDesignerAgent,
  ],
})
export class AgentsModule {}
