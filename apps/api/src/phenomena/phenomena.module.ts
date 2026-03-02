import { Module } from '@nestjs/common';
import { PhenomenaController } from './phenomena.controller';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [AgentsModule],
  controllers: [PhenomenaController],
})
export class PhenomenaModule {}
