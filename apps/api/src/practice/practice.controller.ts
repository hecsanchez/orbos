import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GeneratePracticeDto } from './dto/generate-practice.dto';
import { PracticeGeneratorAgent } from '../agents/practice/practice-generator.agent';

@ApiTags('practice')
@Controller('practice')
export class PracticeController {
  constructor(private readonly practiceGenerator: PracticeGeneratorAgent) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a practice script adapted to mastery level' })
  async generate(@Body() dto: GeneratePracticeDto) {
    return this.practiceGenerator.generate({
      standard_id: dto.standard_id,
      mastery_level: dto.mastery_level,
      student_age: dto.student_age,
    });
  }
}
