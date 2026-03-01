import { Module } from '@nestjs/common';
import { PhenomenaController } from './phenomena.controller';

@Module({
  controllers: [PhenomenaController],
})
export class PhenomenaModule {}
