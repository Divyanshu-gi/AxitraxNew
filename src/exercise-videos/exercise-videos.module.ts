import { Module } from '@nestjs/common';
import { ExerciseVideosService } from './exercise-videos.service';
import { ExerciseVideosController } from './exercise-videos.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  providers: [ExerciseVideosService],
  controllers: [ExerciseVideosController],
  exports: [ExerciseVideosService],
})
export class ExerciseVideosModule {}
