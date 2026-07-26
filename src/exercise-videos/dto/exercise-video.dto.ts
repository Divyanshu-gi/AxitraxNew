import { IsInt, IsOptional, IsString } from 'class-validator';

export class RequestExerciseVideoUploadDto {
  @IsString() exerciseName: string;
  @IsString() contentType: string;
}

export class SaveExerciseVideoDto {
  @IsString() exerciseName: string;
  @IsString() videoUrl: string;
  @IsOptional() @IsString() thumbnailUrl?: string;
  @IsOptional() @IsInt() durationSeconds?: number;
}
