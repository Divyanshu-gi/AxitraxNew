import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReminderDto } from './dto/reminder.dto';
import { Role } from '@prisma/client';

@Injectable()
export class RemindersService {
  constructor(private prisma: PrismaService) {}

  async findAll(gymId: string, role: Role) {
    return this.prisma.reminder.findMany({
      where: {
        gymId,
        ...(role === 'MEMBER' ? { audience: 'MEMBER' as Role } : {}),
        ...(role === 'TRAINER' ? { audience: { in: ['TRAINER', 'MEMBER'] as Role[] } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(gymId: string, dto: CreateReminderDto) {
    return this.prisma.reminder.create({ data: { gymId, ...dto } });
  }

  async remove(gymId: string, id: string) {
    const reminder = await this.prisma.reminder.findFirst({ where: { id, gymId } });
    if (!reminder) throw new NotFoundException('Reminder not found');
    return this.prisma.reminder.delete({ where: { id } });
  }
}
