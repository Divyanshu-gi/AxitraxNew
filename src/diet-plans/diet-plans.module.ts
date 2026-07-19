import { Module } from '@nestjs/common';
import { DietPlansService } from './diet-plans.service';
import { DietPlansController } from './diet-plans.controller';

@Module({
  providers: [DietPlansService],
  controllers: [DietPlansController],
})
export class DietPlansModule {}
