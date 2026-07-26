import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterGymDto, RegisterMemberDto, LoginDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async registerGym(dto: RegisterGymDto) {
    const gymEmail = dto.gymEmail.trim().toLowerCase();
    const adminEmail = dto.adminEmail.trim().toLowerCase();

    const existing = await this.prisma.gym.findUnique({ where: { email: gymEmail } });
    if (existing) throw new ConflictException('A gym with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const gym = await this.prisma.gym.create({
      data: {
        name: dto.gymName,
        email: gymEmail,
        users: {
          create: {
            name: dto.adminName,
            email: adminEmail,
            passwordHash,
            role: 'ADMIN',
          },
        },
      },
      include: { users: true },
    });

    const adminUser = gym.users[0];
    return this.signTokens(adminUser.id, gym.id, 'ADMIN', adminUser.email);
  }

  async registerMember(dto: RegisterMemberDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { name_email: { name: dto.name, email } },
    });
    if (existing) throw new ConflictException('An account with this name and email already exists.');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email,
        passwordHash,
        role: 'MEMBER',
        member: {
          create: {
            name: dto.name,
            email,
          },
        },
      },
    });

    return this.signTokens(user.id, null, 'MEMBER', user.email);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { name_email: { name: dto.name, email } },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.signTokens(user.id, user.gymId, user.role, user.email);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('Invalid refresh token');

    // Re-read gymId/role from the DB rather than the old token payload, so a
    // member linked to a gym after their last login picks up gymId on refresh.
    return this.signTokens(user.id, user.gymId, user.role, user.email);
  }

  private signTokens(userId: string, gymId: string | null, role: string, email: string) {
    const payload = { sub: userId, gymId, role };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN'),
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN'),
    });

    const superAdminEmail = this.config.get<string>('SUPER_ADMIN_EMAIL');
    const isSuperAdmin = !!superAdminEmail && email.toLowerCase() === superAdminEmail.toLowerCase();

    return { accessToken, refreshToken, role, gymId, isSuperAdmin };
  }
}
