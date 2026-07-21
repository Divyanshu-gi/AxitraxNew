import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrainerDto, UpdateTrainerDto } from './dto/trainer.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TrainersService {
  constructor(private prisma: PrismaService) {}

  async findAll(gymId: string) {
    return this.prisma.trainer.findMany({
      where: { gymId },
      include: { members: { select: { id: true, name: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(gymId: string, id: string) {
    const trainer = await this.prisma.trainer.findFirst({
      where: { id, gymId },
      include: { members: true },
    });
    if (!trainer) throw new NotFoundException('Trainer not found');
    return trainer;
  }

  async create(gymId: string, dto: CreateTrainerDto) {
    const existing = await this.prisma.user.findUnique({
      where: { name_email: { name: dto.name, email: dto.email } },
    });
    if (existing) throw new ConflictException('A user with this email already exists in this gym');

    const passwordHash = await bcrypt.hash(dto.password ?? 'Trainer1234', 12);

    const user = await this.prisma.user.create({
      data: {
        gymId,
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: 'TRAINER',
        trainer: {
          create: {
            gymId,
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            specialization: dto.specialization,
          },
        },
      },
      include: { trainer: true },
    });

    return user.trainer;
  }

  async update(gymId: string, id: string, dto: UpdateTrainerDto) {
    await this.findOne(gymId, id);
    return this.prisma.trainer.update({
      where: { id },
      data: {
        name: dto.name,
        phone: dto.phone,
        specialization: dto.specialization,
      },
    });
  }

  async remove(gymId: string, id: string) {
    await this.findOne(gymId, id);
    return this.prisma.trainer.delete({ where: { id } });
  }

  async assignMember(gymId: string, trainerId: string, memberId: string) {
    await this.findOne(gymId, trainerId);
    const member = await this.prisma.member.findFirst({ where: { id: memberId, gymId } });
    if (!member) throw new NotFoundException('Member not found');
    return this.prisma.member.update({ where: { id: memberId }, data: { trainerId } });
  }

  async unassignMember(gymId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({ where: { id: memberId, gymId } });
    if (!member) throw new NotFoundException('Member not found');
    return this.prisma.member.update({ where: { id: memberId }, data: { trainerId: null } });
  }
}
