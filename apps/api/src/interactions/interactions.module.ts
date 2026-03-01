import { Module } from '@nestjs/common';
import { InteractionValidatorService } from './interaction-validator.service';

@Module({
  providers: [InteractionValidatorService],
  exports: [InteractionValidatorService],
})
export class InteractionsModule {}
