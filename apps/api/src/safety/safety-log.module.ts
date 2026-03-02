import { Module } from '@nestjs/common';
import { SafetyLogController } from './safety-log.controller';

@Module({
  controllers: [SafetyLogController],
})
export class SafetyLogModule {}
