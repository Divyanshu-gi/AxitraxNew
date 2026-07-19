import { Module } from '@nestjs/common';
import { WorkoutPlansService } from './workout-plans.service';
import { WorkoutPlansController } from './workout-plans.controller';

@Module({
  providers: [WorkoutPlansService],
  controllers: [WorkoutPlansController],
})
export class WorkoutPlansModule {}
