import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDietPlanDto, UpdateDietPlanDto, CreateDietAssignmentDto } from './dto/diet-plan.dto';
import { Role } from '@prisma/client';

const toDateOnly = (dateStr: string) => new Date(`${dateStr.slice(0, 10)}T00:00:00.000Z`);

@Injectable()
export class DietPlansService {
  constructor(private prisma: PrismaService) {}

  async findAll(gymId: string, role: Role, userId: string) {
    return this.prisma.dietPlan.findMany({
      where: { gymId, ...(role === 'TRAINER' ? { createdByUserId: userId } : {}) },
      include: {
        days: { include: { meals: { include: { items: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(gymId: string, id: string, role?: Role, userId?: string) {
    const plan = await this.prisma.dietPlan.findFirst({
      where: { id, gymId, ...(role === 'TRAINER' ? { createdByUserId: userId } : {}) },
      include: { days: { include: { meals: { include: { items: true } } } } },
    });
    if (!plan) throw new NotFoundException('Diet plan not found');
    return plan;
  }

  async create(gymId: string, createdByUserId: string, dto: CreateDietPlanDto) {
    return this.prisma.dietPlan.create({
      data: {
        gymId,
        createdByUserId,
        name: dto.name,
        goal: dto.goal ?? 'MAINTENANCE',
        targetCalories: dto.targetCalories ?? 2000,
        repeatWeeks: dto.repeatWeeks ?? 4,
        days: {
          create: dto.days.map(day => ({
            weekday: day.weekday,
            meals: {
              create: day.meals.map(meal => ({
                mealType: meal.mealType,
                items: {
                  create: meal.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    calories: item.calories ?? 0,
                  })),
                },
              })),
            },
          })),
        },
      },
      include: { days: { include: { meals: { include: { items: true } } } } },
    });
  }

  async update(gymId: string, id: string, dto: UpdateDietPlanDto, role?: Role, userId?: string) {
    await this.findOne(gymId, id, role, userId);
    await this.prisma.dietPlanDay.deleteMany({ where: { dietPlanId: id } });
    return this.prisma.dietPlan.update({
      where: { id },
      data: {
        name: dto.name,
        goal: dto.goal ?? 'MAINTENANCE',
        targetCalories: dto.targetCalories ?? 2000,
        repeatWeeks: dto.repeatWeeks ?? 4,
        days: {
          create: dto.days.map(day => ({
            weekday: day.weekday,
            meals: {
              create: day.meals.map(meal => ({
                mealType: meal.mealType,
                items: {
                  create: meal.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    calories: item.calories ?? 0,
                  })),
                },
              })),
            },
          })),
        },
      },
      include: { days: { include: { meals: { include: { items: true } } } } },
    });
  }

  async remove(gymId: string, id: string, role?: Role, userId?: string) {
    await this.findOne(gymId, id, role, userId);
    return this.prisma.dietPlan.delete({ where: { id } });
  }

  // ── Assignments ───────────────────────────────────────────────────────────

  async getAssignments(gymId: string, role: Role, userId: string, memberId?: string) {
    let effectiveMemberId = memberId;
    if (role === 'MEMBER') {
      const self = await this.prisma.member.findUnique({ where: { userId } });
      if (!self) return [];
      effectiveMemberId = self.id;
    }
    return this.prisma.dietAssignment.findMany({
      where: { member: { gymId }, ...(effectiveMemberId ? { memberId: effectiveMemberId } : {}) },
      include: {
        member: { select: { id: true, name: true } },
        plan: { select: { id: true, name: true, goal: true, targetCalories: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async assign(gymId: string, dto: CreateDietAssignmentDto, role?: Role, userId?: string) {
    await this.findOne(gymId, dto.planId, role, userId);
    const member = await this.prisma.member.findFirst({ where: { id: dto.memberId, gymId } });
    if (!member) throw new NotFoundException('Member not found');
    return this.prisma.dietAssignment.create({
      data: {
        memberId: dto.memberId,
        planId: dto.planId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  async removeAssignment(gymId: string, assignmentId: string) {
    const assignment = await this.prisma.dietAssignment.findFirst({
      where: { id: assignmentId, member: { gymId } },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return this.prisma.dietAssignment.delete({ where: { id: assignmentId } });
  }

  // ── Meal logs (adherence tracking) ─────────────────────────────────────────

  private async getAccessibleAssignment(gymId: string, assignmentId: string, role?: Role, userId?: string) {
    const assignment = await this.prisma.dietAssignment.findFirst({
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

  async logMeal(gymId: string, assignmentId: string, dateStr: string, mealEntryId: string, role?: Role, userId?: string) {
    const assignment = await this.getAccessibleAssignment(gymId, assignmentId, role, userId);
    const date = toDateOnly(dateStr);
    return this.prisma.dietMealLog.upsert({
      where: { assignmentId_date_mealEntryId: { assignmentId: assignment.id, date, mealEntryId } },
      create: { assignmentId: assignment.id, memberId: assignment.memberId, date, mealEntryId },
      update: {},
    });
  }

  async unlogMeal(gymId: string, assignmentId: string, dateStr: string, mealEntryId: string, role?: Role, userId?: string) {
    const assignment = await this.getAccessibleAssignment(gymId, assignmentId, role, userId);
    await this.prisma.dietMealLog.deleteMany({
      where: { assignmentId: assignment.id, date: toDateOnly(dateStr), mealEntryId },
    });
    return { success: true };
  }

  async getMealLogs(gymId: string, assignmentId: string, role?: Role, userId?: string) {
    const assignment = await this.getAccessibleAssignment(gymId, assignmentId, role, userId);
    return this.prisma.dietMealLog.findMany({
      where: { assignmentId: assignment.id },
      orderBy: { date: 'asc' },
    });
  }
}
