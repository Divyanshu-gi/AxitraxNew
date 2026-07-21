import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async punchIn(gymId: string, memberId: string) {
    await this.assertMemberInGym(gymId, memberId);
    return this.prisma.attendanceLog.create({
      data: { memberId, type: 'IN' },
    });
  }

  async punchOut(gymId: string, memberId: string) {
    await this.assertMemberInGym(gymId, memberId);
    return this.prisma.attendanceLog.create({
      data: { memberId, type: 'OUT' },
    });
  }

  async getToday(gymId: string, memberId?: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return this.prisma.attendanceLog.findMany({
      where: {
        timestamp: { gte: start, lte: end },
        member: { gymId },
        ...(memberId ? { memberId } : {}),
      },
      include: { member: { select: { id: true, name: true } } },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getHistory(gymId: string, memberId: string, from?: string, to?: string) {
    await this.assertMemberInGym(gymId, memberId);
    return this.prisma.attendanceLog.findMany({
      where: {
        memberId,
        ...(from || to
          ? { timestamp: { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } }
          : {}),
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getConsistency(gymId: string, memberId: string) {
    await this.assertMemberInGym(gymId, memberId);

    const since = new Date();
    since.setDate(since.getDate() - 90);

    const logs = await this.prisma.attendanceLog.findMany({
      where: { memberId, type: 'IN', timestamp: { gte: since } },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
    });

    const visitDays = new Set(logs.map((log) => log.timestamp.toISOString().slice(0, 10)));

    let currentStreak = 0;
    const cursor = new Date();
    cursor.setUTCHours(0, 0, 0, 0);
    while (visitDays.has(cursor.toISOString().slice(0, 10))) {
      currentStreak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const visitsThisWeek = [...visitDays].filter((d) => new Date(d) >= weekAgo).length;
    const visitsThisMonth = [...visitDays].filter((d) => new Date(d) >= monthAgo).length;

    return { currentStreak, visitsThisWeek, visitsThisMonth };
  }

  async getCounts(gymId: string, role?: Role, userId?: string): Promise<Record<string, number>> {
    const members = await this.prisma.member.findMany({
      where: { gymId, ...(role === 'TRAINER' ? { trainer: { userId } } : {}) },
      select: { id: true },
    });
    const memberIds = members.map((m) => m.id);
    if (memberIds.length === 0) return {};

    const grouped = await this.prisma.attendanceLog.groupBy({
      by: ['memberId'],
      where: { memberId: { in: memberIds }, type: 'IN' },
      _count: { _all: true },
    });

    return Object.fromEntries(grouped.map((g) => [g.memberId, g._count._all]));
  }

  private async assertMemberInGym(gymId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({ where: { id: memberId, gymId } });
    if (!member) throw new NotFoundException('Member not found in this gym');
  }
}
