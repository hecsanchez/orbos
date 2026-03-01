import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LogAttemptDto } from './dto/log-attempt.dto';
import { AttemptsService, AttemptWithMastery } from './attempts.service';

@ApiTags('attempts')
@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post('log')
  @ApiOperation({ summary: 'Log a student attempt and update mastery' })
  async log(@Body() dto: LogAttemptDto): Promise<AttemptWithMastery> {
    return this.attemptsService.logAttempt(dto);
  }
}
