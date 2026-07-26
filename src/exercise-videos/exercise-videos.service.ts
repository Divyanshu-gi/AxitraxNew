import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { R2Service } from '../storage/r2.service';
import { slugify } from '../common/slugify';
import { RequestExerciseVideoUploadDto, SaveExerciseVideoDto } from './dto/exercise-video.dto';

@Injectable()
export class ExerciseVideosService {
  constructor(
    private prisma: PrismaService,
    private r2: R2Service,
  ) {}

  listAll() {
    return this.prisma.exerciseVideo.findMany({ orderBy: { exerciseName: 'asc' } });
  }

  // Used by WorkoutPlansService to attach playback URLs to exercises by name
  // — a slug -> video lookup map, fetched once per request.
  async mapBySlug(): Promise<Map<string, { videoUrl: string; thumbnailUrl: string | null; durationSeconds: number | null }>> {
    const rows = await this.prisma.exerciseVideo.findMany();
    return new Map(rows.map(r => [r.exerciseSlug, r]));
  }

  async requestUploadUrl(dto: RequestExerciseVideoUploadDto) {
    const slug = slugify(dto.exerciseName);
    const key = this.r2.buildExerciseVideoKey(slug, dto.contentType);
    const uploadUrl = await this.r2.getUploadUrl(key, dto.contentType);
    return { uploadUrl, publicUrl: this.r2.publicUrlFor(key), key, slug };
  }

  async save(dto: SaveExerciseVideoDto) {
    const slug = slugify(dto.exerciseName);
    const existing = await this.prisma.exerciseVideo.findUnique({ where: { exerciseSlug: slug } });

    const previousKey = existing?.videoUrl ? this.r2.keyFromPublicUrl(existing.videoUrl) : null;
    if (previousKey && previousKey !== this.r2.keyFromPublicUrl(dto.videoUrl)) {
      await this.r2.deleteObject(previousKey).catch(() => undefined);
    }

    return this.prisma.exerciseVideo.upsert({
      where: { exerciseSlug: slug },
      create: {
        exerciseSlug: slug,
        exerciseName: dto.exerciseName,
        videoUrl: dto.videoUrl,
        thumbnailUrl: dto.thumbnailUrl,
        durationSeconds: dto.durationSeconds,
      },
      update: {
        exerciseName: dto.exerciseName,
        videoUrl: dto.videoUrl,
        thumbnailUrl: dto.thumbnailUrl,
        durationSeconds: dto.durationSeconds,
      },
    });
  }

  async remove(exerciseName: string) {
    const slug = slugify(exerciseName);
    const existing = await this.prisma.exerciseVideo.findUnique({ where: { exerciseSlug: slug } });
    if (!existing) throw new NotFoundException('No video mapped to this exercise');

    const key = this.r2.keyFromPublicUrl(existing.videoUrl);
    if (key) await this.r2.deleteObject(key).catch(() => undefined);

    return this.prisma.exerciseVideo.delete({ where: { exerciseSlug: slug } });
  }
}
