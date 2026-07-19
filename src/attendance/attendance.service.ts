import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

  private async assertMemberInGym(gymId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({ where: { id: memberId, gymId } });
    if (!member) throw new NotFoundException('Member not found in this gym');
  }
}
