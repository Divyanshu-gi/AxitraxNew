import { Controller, Post, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private attendance: AttendanceService) {}

  @Post(':memberId/punch-in')
  @Roles('ADMIN', 'TRAINER', 'MEMBER')
  punchIn(@CurrentUser() user: User, @Param('memberId') memberId: string) {
    return this.attendance.punchIn(user.gymId, memberId);
  }

  @Post(':memberId/punch-out')
  @Roles('ADMIN', 'TRAINER', 'MEMBER')
  punchOut(@CurrentUser() user: User, @Param('memberId') memberId: string) {
    return this.attendance.punchOut(user.gymId, memberId);
  }

  @Get('today')
  @Roles('ADMIN', 'TRAINER')
  getToday(@CurrentUser() user: User, @Query('memberId') memberId?: string) {
    return this.attendance.getToday(user.gymId, memberId);
  }

  @Get('counts')
  @Roles('ADMIN', 'TRAINER')
  getCounts(@CurrentUser() user: User) {
    return this.attendance.getCounts(user.gymId, user.role, user.id);
  }

  @Get(':memberId/history')
  @Roles('ADMIN', 'TRAINER', 'MEMBER')
  getHistory(
    @CurrentUser() user: User,
    @Param('memberId') memberId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.attendance.getHistory(user.gymId, memberId, from, to);
  }
}
