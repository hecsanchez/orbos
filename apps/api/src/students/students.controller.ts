import { Controller, Get } from '@nestjs/common';

@Controller('students')
export class StudentsController {
  @Get()
  findAll() {
    return { data: [], message: 'stub' };
  }
}
