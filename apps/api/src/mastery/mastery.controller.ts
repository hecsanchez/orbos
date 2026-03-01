import { Controller, Get, Param } from '@nestjs/common';

@Controller('mastery')
export class MasteryController {
  @Get(':studentId/:standardId')
  findOne(
    @Param('studentId') studentId: string,
    @Param('standardId') standardId: string,
  ) {
    return { studentId, standardId, masteryLevel: 0, message: 'stub' };
  }
}
