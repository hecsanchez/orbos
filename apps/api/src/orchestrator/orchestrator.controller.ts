import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrchestratorPlanDto } from './dto/orchestrator-plan.dto';

@ApiTags('orchestrator')
@Controller('orchestrator')
export class OrchestratorController {
  @Get('daily-plan/:studentId')
  @ApiOperation({ summary: 'Get the daily learning plan for a student' })
  getDailyPlan(@Param('studentId') studentId: string): OrchestratorPlanDto {
    return {
      student_id: studentId,
      date: new Date().toISOString().split('T')[0],
      plan: [],
    };
  }
}
