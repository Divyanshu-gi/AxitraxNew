import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberDto, UpdateMemberDto, LinkMemberDto, UpdateMemberProfileDto } from './dto/member.dto';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async findAll(gymId: string, role?: Role, userId?: string, trainerId?: string) {
    return this.prisma.member.findMany({
      where: {
        gymId,
        ...(role === 'TRAINER' ? { trainer: { userId } } : trainerId ? { trainerId } : {}),
      },
      include: { membershipPlan: true, trainer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(gymId: string, id: string, role?: Role, userId?: string) {
    const member = await this.prisma.member.findFirst({
      where: { id, gymId, ...(role === 'TRAINER' ? { trainer: { userId } } : {}) },
      include: { membershipPlan: true, trainer: true },
    });
    if (!member) throw new NotFoundException('Member not found');
    return member;
  }

  async create(gymId: string, dto: CreateMemberDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { name_email: { name: dto.name, email } },
    });
    if (existing) throw new ConflictException('A user with this email already exists in this gym');

    const passwordHash = await bcrypt.hash(dto.password ?? email, 12);

    const user = await this.prisma.user.create({
      data: {
        gymId,
        name: dto.name,
        email,
        passwordHash,
        role: 'MEMBER',
        member: {
          create: {
            gymId,
            name: dto.name,
            email,
            phone: dto.phone,
            goal: dto.goal,
            trainerId: dto.trainerId,
            membershipPlanId: dto.membershipPlanId,
            status: dto.status ?? 'ACTIVE',
            startDate: dto.startDate ? new Date(dto.startDate) : undefined,
            renewalDate: dto.renewalDate ? new Date(dto.renewalDate) : undefined,
            amountPaid: dto.amountPaid,
            discount: dto.discount,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
            gender: dto.gender,
            heightFeet: dto.heightFeet,
            weightKg: dto.weightKg,
            emergencyContactName: dto.emergencyContactName,
            emergencyContactPhone: dto.emergencyContactPhone,
            emergencyContactRelationship: dto.emergencyContactRelationship,
          },
        },
      },
      include: { member: { include: { membershipPlan: true, trainer: true } } },
    });

    return user.member;
  }

  async update(gymId: string, id: string, dto: UpdateMemberDto) {
    await this.findOne(gymId, id);
    return this.prisma.member.update({
      where: { id },
      data: {
        name: dto.name,
        phone: dto.phone,
        goal: dto.goal,
        trainerId: dto.trainerId,
        membershipPlanId: dto.membershipPlanId,
        status: dto.status,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        renewalDate: dto.renewalDate ? new Date(dto.renewalDate) : undefined,
        amountPaid: dto.amountPaid,
        discount: dto.discount,
        gender: dto.gender,
        heightFeet: dto.heightFeet,
        weightKg: dto.weightKg,
        emergencyContactName: dto.emergencyContactName,
        emergencyContactPhone: dto.emergencyContactPhone,
        emergencyContactRelationship: dto.emergencyContactRelationship,
      },
    });
  }

  async findMe(userId: string) {
    const member = await this.prisma.member.findUnique({
      where: { userId },
      include: { membershipPlan: true, trainer: true },
    });
    if (!member) throw new NotFoundException('Member profile not found');
    return member;
  }

  async updateMe(userId: string, dto: UpdateMemberProfileDto) {
    const member = await this.prisma.member.findUnique({ where: { userId } });
    if (!member) throw new NotFoundException('Member profile not found');

    const email = dto.email ? dto.email.trim().toLowerCase() : undefined;

    try {
      const [, updatedMember] = await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: {
            ...(dto.name ? { name: dto.name } : {}),
            ...(email ? { email } : {}),
          },
        }),
        this.prisma.member.update({
          where: { id: member.id },
          data: {
            name: dto.name,
            email,
            phone: dto.phone,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
            gender: dto.gender,
            heightFeet: dto.heightFeet,
            weightKg: dto.weightKg,
            bodyFatPercent: dto.bodyFatPercent,
            location: dto.location,
            emergencyContactName: dto.emergencyContactName,
            emergencyContactPhone: dto.emergencyContactPhone,
            emergencyContactRelationship: dto.emergencyContactRelationship,
          },
        }),
      ]);
      return updatedMember;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('An account with this name and email already exists.');
      }
      throw err;
    }
  }

  async remove(gymId: string, id: string) {
    await this.findOne(gymId, id);
    return this.prisma.member.delete({ where: { id } });
  }

  async linkByEmail(gymId: string, dto: LinkMemberDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({ where: { email, role: 'MEMBER' } });
    if (!user) throw new NotFoundException('No member account found with this email. Ask them to register in the app first.');

    const existingMember = await this.prisma.member.findUnique({ where: { userId: user.id } });
    if (existingMember?.gymId === gymId) throw new ConflictException('This member is already linked to your gym.');
    if (existingMember?.gymId) throw new ConflictException('This member is already linked to another gym.');

    await this.prisma.user.update({ where: { id: user.id }, data: { gymId } });

    const memberData = {
      gymId,
      name: user.name,
      email: user.email,
      phone: dto.phone,
      goal: dto.goal,
      trainerId: dto.trainerId,
      membershipPlanId: dto.membershipPlanId,
      status: dto.status ?? 'ACTIVE',
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      renewalDate: dto.renewalDate ? new Date(dto.renewalDate) : undefined,
      amountPaid: dto.amountPaid,
      discount: dto.discount,
    };

    return this.prisma.member.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...memberData,
      },
      update: memberData,
      include: { membershipPlan: true, trainer: true },
    });
  }
}
