import { Module } from '@nestjs/common';
import { OrchestratorController } from './orchestrator.controller';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [AgentsModule],
  controllers: [OrchestratorController],
})
export class OrchestratorModule {}
