import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [AgentsModule],
  controllers: [LessonsController],
})
export class LessonsModule {}
