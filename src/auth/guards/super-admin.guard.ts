import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Identity-based, not role-based: gates the shared exercise-video library to
// exactly one login (see SUPER_ADMIN_EMAIL), regardless of role or which gym
// the account is scoped to. Every gym's own ADMIN — current or future — is
// denied here even though they pass the normal JwtAuthGuard/RolesGuard.
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    const superAdminEmail = this.config.get<string>('SUPER_ADMIN_EMAIL');
    if (!superAdminEmail || user?.email?.toLowerCase() !== superAdminEmail.toLowerCase()) {
      throw new ForbiddenException('Only the platform super-admin can manage exercise videos');
    }
    return true;
  }
}
