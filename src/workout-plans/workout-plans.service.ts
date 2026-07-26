import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkoutPlanDto, UpdateWorkoutPlanDto, CreateWorkoutAssignmentDto } from './dto/workout-plan.dto';
import { Role } from '@prisma/client';
import { ExerciseVideosService } from '../exercise-videos/exercise-videos.service';
import { slugify } from '../common/slugify';

const toDateOnly = (dateStr: string) => new Date(`${dateStr.slice(0, 10)}T00:00:00.000Z`);

@Injectable()
export class WorkoutPlansService {
  constructor(
    private prisma: PrismaService,
    private exerciseVideos: ExerciseVideosService,
  ) {}

  // Attaches the shared catalog's video/thumbnail/duration to each exercise
  // by slugified name — every gym's copy of "Barbell Bench Press" resolves
  // to the same clip the super-admin uploaded once, with no per-row storage.
  private async withVideoData<T extends {days: {exercises: {name: string}[]}[]}>(plan: T): Promise<T>;
  private async withVideoData<T extends {days: {exercises: {name: string}[]}[]}>(plans: T[]): Promise<T[]>;
  private async withVideoData(planOrPlans: any) {
    const videoMap = await this.exerciseVideos.mapBySlug();
    const attach = (plan: any) => ({
      ...plan,
      days: plan.days.map((day: any) => ({
        ...day,
        exercises: day.exercises.map((ex: any) => {
          const video = videoMap.get(slugify(ex.name));
          return {
            ...ex,
            videoUrl: video?.videoUrl,
            thumbnailUrl: video?.thumbnailUrl ?? undefined,
            durationSeconds: video?.durationSeconds ?? undefined,
          };
        }),
      })),
    });
    return Array.isArray(planOrPlans) ? planOrPlans.map(attach) : attach(planOrPlans);
  }

  async findAll(gymId: string, role: Role, userId: string) {
    const plans = await this.prisma.workoutPlan.findMany({
      where: { gymId, ...(role === 'TRAINER' ? { createdByUserId: userId } : {}) },
      include: { days: { include: { exercises: { orderBy: { orderIndex: 'asc' } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return this.withVideoData(plans);
  }

  async findOne(gymId: string, id: string, role?: Role, userId?: string) {
    const plan = await this.prisma.workoutPlan.findFirst({
      where: { id, gymId, ...(role === 'TRAINER' ? { createdByUserId: userId } : {}) },
      include: { days: { include: { exercises: { orderBy: { orderIndex: 'asc' } } } } },
    });
    if (!plan) throw new NotFoundException('Workout plan not found');
    return this.withVideoData(plan);
  }

  async create(gymId: string, createdByUserId: string, dto: CreateWorkoutPlanDto) {
    return this.prisma.workoutPlan.create({
      data: {
        gymId,
        createdByUserId,
        title: dto.title,
        level: dto.level,
        focus: dto.focus,
        repeatWeeks: dto.repeatWeeks ?? 4,
        days: {
          create: dto.days.map(day => ({
            weekday: day.weekday,
            title: day.title,
            durationMinutes: day.durationMinutes ?? 45,
            exercises: {
              create: day.exercises.map((ex, i) => ({
                name: ex.name,
                reps: ex.reps,
                rest: ex.rest,
                orderIndex: ex.orderIndex ?? i,
              })),
            },
          })),
        },
      },
      include: { days: { include: { exercises: true } } },
    });
  }

  async update(gymId: string, id: string, dto: UpdateWorkoutPlanDto, role?: Role, userId?: string) {
    await this.findOne(gymId, id, role, userId);
    // Delete existing days and recreate — simplest strategy for nested updates
    await this.prisma.workoutPlanDay.deleteMany({ where: { workoutPlanId: id } });
    return this.prisma.workoutPlan.update({
      where: { id },
      data: {
        title: dto.title,
        level: dto.level,
        focus: dto.focus,
        repeatWeeks: dto.repeatWeeks ?? 4,
        days: {
          create: dto.days.map(day => ({
            weekday: day.weekday,
            title: day.title,
            durationMinutes: day.durationMinutes ?? 45,
            exercises: {
              create: day.exercises.map((ex, i) => ({
                name: ex.name,
                reps: ex.reps,
                rest: ex.rest,
                orderIndex: ex.orderIndex ?? i,
              })),
            },
          })),
        },
      },
      include: { days: { include: { exercises: true } } },
    });
  }

  async remove(gymId: string, id: string, role?: Role, userId?: string) {
    await this.findOne(gymId, id, role, userId);
    return this.prisma.workoutPlan.delete({ where: { id } });
  }

  // ── Assignments ───────────────────────────────────────────────────────────

  async getAssignments(gymId: string, role: Role, userId: string, memberId?: string) {
    let effectiveMemberId = memberId;
    if (role === 'MEMBER') {
      const self = await this.prisma.member.findUnique({ where: { userId } });
      if (!self) return [];
      effectiveMemberId = self.id;
    }
    return this.prisma.workoutAssignment.findMany({
      where: { member: { gymId }, ...(effectiveMemberId ? { memberId: effectiveMemberId } : {}) },
      include: {
        member: { select: { id: true, name: true } },
        plan: { select: { id: true, title: true, level: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async assign(gymId: string, dto: CreateWorkoutAssignmentDto, role?: Role, userId?: string) {
    await this.findOne(gymId, dto.planId, role, userId);
    const member = await this.prisma.member.findFirst({ where: { id: dto.memberId, gymId } });
    if (!member) throw new NotFoundException('Member not found');
    return this.prisma.workoutAssignment.create({
      data: {
        memberId: dto.memberId,
        planId: dto.planId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  async removeAssignment(gymId: string, assignmentId: string) {
    const assignment = await this.prisma.workoutAssignment.findFirst({
      where: { id: assignmentId, member: { gymId } },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return this.prisma.workoutAssignment.delete({ where: { id: assignmentId } });
  }

  // ── Day logs (adherence tracking) ──────────────────────────────────────────

  private async getAccessibleAssignment(gymId: string, assignmentId: string, role?: Role, userId?: string) {
    const assignment = await this.prisma.workoutAssignment.findFirst({
      where: {
        id: assignmentId,
        member: {
          gymId,
          ...(role === 'MEMBER' ? { userId } : {}),
          ...(role === 'TRAINER' ? { trainer: { userId } } : {}),
        },
      },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  async logDay(gymId: string, assignmentId: string, dateStr: string, role?: Role, userId?: string) {
    const assignment = await this.getAccessibleAssignment(gymId, assignmentId, role, userId);
    const date = toDateOnly(dateStr);
    return this.prisma.workoutDayLog.upsert({
      where: { assignmentId_date: { assignmentId: assignment.id, date } },
      create: { assignmentId: assignment.id, memberId: assignment.memberId, date },
      update: {},
    });
  }

  async unlogDay(gymId: string, assignmentId: string, dateStr: string, role?: Role, userId?: string) {
    const assignment = await this.getAccessibleAssignment(gymId, assignmentId, role, userId);
    await this.prisma.workoutDayLog.deleteMany({
      where: { assignmentId: assignment.id, date: toDateOnly(dateStr) },
    });
    return { success: true };
  }

  async getDayLogs(gymId: string, assignmentId: string, role?: Role, userId?: string) {
    const assignment = await this.getAccessibleAssignment(gymId, assignmentId, role, userId);
    return this.prisma.workoutDayLog.findMany({
      where: { assignmentId: assignment.id },
      orderBy: { date: 'asc' },
    });
  }
}
