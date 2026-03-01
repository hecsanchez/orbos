import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchStandardsDto } from './dto/search-standards.dto';
import { StandardResponseDto } from './dto/standard-response.dto';

@ApiTags('standards')
@Controller('standards')
export class StandardsController {
  @Get('search')
  @ApiOperation({ summary: 'Search standards by semantic query' })
  search(@Query() dto: SearchStandardsDto): StandardResponseDto[] {
    return [];
  }
}
