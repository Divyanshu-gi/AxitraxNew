import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceService } from '../attendance/attendance.service';
import { CreateMeasurementDto } from './dto/progress.dto';

@Injectable()
export class ProgressService {
  constructor(
    private prisma: PrismaService,
    private attendance: AttendanceService,
  ) {}

  async addMeasurement(gymId: string, memberId: string, dto: CreateMeasurementDto) {
    await this.assertMemberInGym(gymId, memberId);
    const recordedAt = dto.recordedAt ? new Date(dto.recordedAt) : undefined;

    const [measurement] = await this.prisma.$transaction([
      this.prisma.bodyMeasurement.create({
        data: {
          memberId,
          weightKg: dto.weightKg,
          bodyFatPercent: dto.bodyFatPercent,
          note: dto.note,
          ...(recordedAt ? { recordedAt } : {}),
        },
      }),
      this.prisma.member.update({
        where: { id: memberId },
        data: {
          ...(dto.weightKg !== undefined ? { weightKg: dto.weightKg } : {}),
          ...(dto.bodyFatPercent !== undefined ? { bodyFatPercent: dto.bodyFatPercent } : {}),
        },
      }),
    ]);

    return measurement;
  }

  async getMeasurements(gymId: string, memberId: string, from?: string, to?: string) {
    await this.assertMemberInGym(gymId, memberId);
    return this.prisma.bodyMeasurement.findMany({
      where: {
        memberId,
        ...(from || to
          ? { recordedAt: { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } }
          : {}),
      },
      orderBy: { recordedAt: 'desc' },
    });
  }

  async getSummary(gymId: string, memberId: string) {
    await this.assertMemberInGym(gymId, memberId);

    const [latest, consistency] = await Promise.all([
      this.prisma.bodyMeasurement.findFirst({ where: { memberId }, orderBy: { recordedAt: 'desc' } }),
      this.attendance.getConsistency(gymId, memberId),
    ]);

    const trendCutoff = new Date();
    trendCutoff.setDate(trendCutoff.getDate() - 30);
    const baseline = await this.prisma.bodyMeasurement.findFirst({
      where: { memberId, recordedAt: { lte: trendCutoff } },
      orderBy: { recordedAt: 'desc' },
    });

    const weightChangeKg =
      latest?.weightKg != null && baseline?.weightKg != null ? latest.weightKg - baseline.weightKg : null;
    const bodyFatChangePercent =
      latest?.bodyFatPercent != null && baseline?.bodyFatPercent != null
        ? latest.bodyFatPercent - baseline.bodyFatPercent
        : null;

    return {
      latest: latest ?? null,
      trend: { weightChangeKg, bodyFatChangePercent, comparedTo: baseline?.recordedAt ?? null },
      consistency,
    };
  }

  private async assertMemberInGym(gymId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({ where: { id: memberId, gymId } });
    if (!member) throw new NotFoundException('Member not found in this gym');
  }
}
