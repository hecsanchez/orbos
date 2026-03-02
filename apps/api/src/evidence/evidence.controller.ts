import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { UploadEvidenceDto } from './dto/upload-evidence.dto';
import { EvidenceResponseDto } from './dto/evidence-response.dto';
import { EvidenceService } from './evidence.service';

@ApiTags('evidence')
@Controller('evidence')
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload evidence for a phenomenon' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadEvidenceDto,
  ): Promise<EvidenceResponseDto> {
    return this.evidenceService.upload(file, dto);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'List evidence for a student' })
  async listByStudent(
    @Param('studentId') studentId: string,
  ): Promise<EvidenceResponseDto[]> {
    return this.evidenceService.listByStudent(studentId);
  }

  @Get('phenomenon/:phenomenonId')
  @ApiOperation({ summary: 'List evidence for a phenomenon' })
  async listByPhenomenon(
    @Param('phenomenonId') phenomenonId: string,
  ): Promise<EvidenceResponseDto[]> {
    return this.evidenceService.listByPhenomenon(phenomenonId);
  }
}
