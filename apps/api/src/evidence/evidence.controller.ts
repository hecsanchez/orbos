import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UploadEvidenceDto } from './dto/upload-evidence.dto';
import { EvidenceResponseDto } from './dto/evidence-response.dto';

@ApiTags('evidence')
@Controller('evidence')
export class EvidenceController {
  @Post('upload')
  @ApiOperation({ summary: 'Upload evidence for a phenomenon' })
  upload(@Body() dto: UploadEvidenceDto): EvidenceResponseDto {
    return {
      id: '00000000-0000-0000-0000-000000000000',
      student_id: dto.student_id,
      standard_id: dto.standard_id,
      phenomenon_id: dto.phenomenon_id,
      type: dto.type,
      storage_url: '',
      captured_at: new Date().toISOString(),
    };
  }
}
