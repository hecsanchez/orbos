import { Controller, Post, Put, Param } from '@nestjs/common';

@Controller('phenomena')
export class PhenomenaController {
  @Post('propose')
  propose() {
    return { data: null, message: 'stub' };
  }

  @Put(':id/approve')
  approve(@Param('id') id: string) {
    return { id, approved: true, message: 'stub' };
  }
}
