import { Module } from '@nestjs/common';
import { StandardsController } from './standards.controller';

@Module({
  controllers: [StandardsController],
})
export class StandardsModule {}
