import { Module } from '@nestjs/common';
import { MasteryController } from './mastery.controller';

@Module({
  controllers: [MasteryController],
})
export class MasteryModule {}
