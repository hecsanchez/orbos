import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LogAttemptDto } from './dto/log-attempt.dto';
import { AttemptResponseDto } from './dto/attempt-response.dto';

@ApiTags('attempts')
@Controller('attempts')
export class AttemptsController {
  @Post('log')
  @ApiOperation({ summary: 'Log a student attempt' })
  log(@Body() dto: LogAttemptDto): AttemptResponseDto {
    return {
      id: '00000000-0000-0000-0000-000000000000',
      student_id: dto.student_id,
      standard_id: dto.standard_id,
      interaction_component: dto.interaction_component,
      correct: dto.correct,
      time_spent_seconds: dto.time_spent_seconds,
      hint_used: dto.hint_used,
      source: dto.source,
      created_at: new Date().toISOString(),
    };
  }
}
