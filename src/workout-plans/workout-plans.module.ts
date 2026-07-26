import { Module } from '@nestjs/common';
import { WorkoutPlansService } from './workout-plans.service';
import { WorkoutPlansController } from './workout-plans.controller';
import { ExerciseVideosModule } from '../exercise-videos/exercise-videos.module';

@Module({
  imports: [ExerciseVideosModule],
  providers: [WorkoutPlansService],
  controllers: [WorkoutPlansController],
})
export class WorkoutPlansModule {}
