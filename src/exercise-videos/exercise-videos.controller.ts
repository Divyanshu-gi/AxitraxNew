import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ExerciseVideosService } from './exercise-videos.service';
import { RequestExerciseVideoUploadDto, SaveExerciseVideoDto } from './dto/exercise-video.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';

// Every endpoint here is gated by SuperAdminGuard, not @Roles — this is the
// shared exercise-video library, editable only by the one allowlisted login
// (SUPER_ADMIN_EMAIL), regardless of role or which gym they're scoped to.
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('exercise-videos')
export class ExerciseVideosController {
  constructor(private videos: ExerciseVideosService) {}

  @Get()
  listAll() {
    return this.videos.listAll();
  }

  @Post('upload-url')
  requestUploadUrl(@Body() dto: RequestExerciseVideoUploadDto) {
    return this.videos.requestUploadUrl(dto);
  }

  @Put()
  save(@Body() dto: SaveExerciseVideoDto) {
    return this.videos.save(dto);
  }

  @Delete(':exerciseName')
  remove(@Param('exerciseName') exerciseName: string) {
    return this.videos.remove(decodeURIComponent(exerciseName));
  }
}
