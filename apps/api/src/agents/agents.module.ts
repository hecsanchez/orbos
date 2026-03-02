import { Module } from '@nestjs/common';
import { LLMClient } from '../llm/llm-client';
import { PromptTemplateService } from '../llm/prompt-template.service';
import { InteractionValidatorService } from '../interactions/interaction-validator.service';
import { RagModule } from '../rag/rag.module';
import { SafetyAgent } from './safety/safety.agent';
import { LessonDesignerAgent } from './lessons/lesson-designer.agent';
import { MasteryEstimatorAgent } from './mastery/mastery-estimator.agent';
import { PracticeGeneratorAgent } from './practice/practice-generator.agent';
import { OrchestratorAgent } from './orchestrator/orchestrator.agent';
import { PhenomenonDesignerAgent } from './phenomenon/phenomenon-designer.agent';

@Module({
  imports: [RagModule],
  providers: [
    LLMClient,
    PromptTemplateService,
    InteractionValidatorService,
    SafetyAgent,
    LessonDesignerAgent,
    MasteryEstimatorAgent,
    PracticeGeneratorAgent,
    OrchestratorAgent,
    PhenomenonDesignerAgent,
  ],
  exports: [
    LLMClient,
    PromptTemplateService,
    SafetyAgent,
    LessonDesignerAgent,
    MasteryEstimatorAgent,
    PracticeGeneratorAgent,
    OrchestratorAgent,
    PhenomenonDesignerAgent,
  ],
})
export class AgentsModule {}
