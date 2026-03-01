import { Controller, Get } from '@nestjs/common';

@Controller('standards')
export class StandardsController {
  @Get('search')
  search() {
    return { data: [], message: 'stub' };
  }
}
