import { Controller, Post } from '@nestjs/common';

@Controller('lessons')
export class LessonsController {
  @Post('generate')
  generate() {
    return { data: null, message: 'stub' };
  }
}
