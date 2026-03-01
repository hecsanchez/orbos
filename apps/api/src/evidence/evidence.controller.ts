import { Controller, Post } from '@nestjs/common';

@Controller('evidence')
export class EvidenceController {
  @Post('upload')
  upload() {
    return { data: null, message: 'stub' };
  }
}
