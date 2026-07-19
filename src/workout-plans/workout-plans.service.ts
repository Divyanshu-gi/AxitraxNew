import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkoutPlanDto, UpdateWorkoutPlanDto, CreateWorkoutAssignmentDto } from './dto/workout-plan.dto';
import { Role } from '@prisma/client';

@Injectable()
export class WorkoutPlansService {
  constructor(private prisma: PrismaService) {}

  async findAll(gymId: string, role: Role, userId: string) {
    return this.prisma.workoutPlan.findMany({
      where: { gymId, ...(role === 'TRAINER' ? { createdByUserId: userId } : {}) },
      include: { days: { include: { exercises: { orderBy: { orderIndex: 'asc' } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(gymId: string, id: string, role?: Role, userId?: string) {
    const plan = await this.prisma.workoutPlan.findFirst({
      where: { id, gymId, ...(role === 'TRAINER' ? { createdByUserId: userId } : {}) },
      include: { days: { include: { exercises: { orderBy: { orderIndex: 'asc' } } } } },
    });
    if (!plan) throw new NotFoundException('Workout plan not found');
    return plan;
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
}
