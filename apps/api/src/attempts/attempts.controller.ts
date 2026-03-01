import { Controller, Post } from '@nestjs/common';

@Controller('attempts')
export class AttemptsController {
  @Post('log')
  log() {
    return { data: null, message: 'stub' };
  }
}
