import { Module } from '@nestjs/common';
import { PracticeController } from './practice.controller';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [AgentsModule],
  controllers: [PracticeController],
})
export class PracticeModule {}
