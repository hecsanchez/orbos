import { Controller, Post, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProposePhenomenonDto } from './dto/propose-phenomenon.dto';
import { ApprovePhenomenonDto } from './dto/approve-phenomenon.dto';
import { PhenomenonResponseDto } from './dto/phenomenon-response.dto';

@ApiTags('phenomena')
@Controller('phenomena')
export class PhenomenaController {
  @Post('propose')
  @ApiOperation({ summary: 'Generate phenomenon proposals for a student' })
  propose(@Body() dto: ProposePhenomenonDto): PhenomenonResponseDto {
    return {
      id: '00000000-0000-0000-0000-000000000000',
      student_id: dto.student_id,
      linked_standards: [],
      title: 'Placeholder phenomenon',
      facilitation_guide: '',
      evidence_prompt: '',
      materials_needed: [],
      status: 'pending',
      approved_by: null,
      approved_at: null,
    };
  }

  @Put(':id/approve')
  @ApiOperation({ summary: 'Approve a phenomenon proposal' })
  approve(
    @Param('id') id: string,
    @Body() dto: ApprovePhenomenonDto,
  ): PhenomenonResponseDto {
    return {
      id,
      student_id: '00000000-0000-0000-0000-000000000000',
      linked_standards: [],
      title: 'Placeholder phenomenon',
      facilitation_guide: '',
      evidence_prompt: '',
      materials_needed: [],
      status: 'approved',
      approved_by: dto.approved_by,
      approved_at: new Date().toISOString(),
    };
  }
}
