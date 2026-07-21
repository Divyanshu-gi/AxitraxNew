import { Controller, Post, Get, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { CreateMeasurementDto } from './dto/progress.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('progress')
export class ProgressController {
  constructor(private progress: ProgressService) {}

  @Post(':memberId/measurements')
  @Roles('ADMIN', 'TRAINER', 'MEMBER')
  addMeasurement(
    @CurrentUser() user: User,
    @Param('memberId') memberId: string,
    @Body() dto: CreateMeasurementDto,
  ) {
    return this.progress.addMeasurement(user.gymId, memberId, dto);
  }

  @Get(':memberId/measurements')
  @Roles('ADMIN', 'TRAINER', 'MEMBER')
  getMeasurements(
    @CurrentUser() user: User,
    @Param('memberId') memberId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.progress.getMeasurements(user.gymId, memberId, from, to);
  }

  @Get(':memberId')
  @Roles('ADMIN', 'TRAINER', 'MEMBER')
  getSummary(@CurrentUser() user: User, @Param('memberId') memberId: string) {
    return this.progress.getSummary(user.gymId, memberId);
  }
}
