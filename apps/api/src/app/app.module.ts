import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { StudentsModule } from '../students/students.module';
import { StandardsModule } from '../standards/standards.module';
import { LessonsModule } from '../lessons/lessons.module';
import { AttemptsModule } from '../attempts/attempts.module';
import { MasteryModule } from '../mastery/mastery.module';
import { PhenomenaModule } from '../phenomena/phenomena.module';
import { EvidenceModule } from '../evidence/evidence.module';
import { AgentsModule } from '../agents/agents.module';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';
import { PracticeModule } from '../practice/practice.module';

@Module({
  imports: [
    StudentsModule,
    StandardsModule,
    LessonsModule,
    AttemptsModule,
    MasteryModule,
    PhenomenaModule,
    EvidenceModule,
    AgentsModule,
    OrchestratorModule,
    PracticeModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
