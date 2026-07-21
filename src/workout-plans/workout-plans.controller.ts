import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { WorkoutPlansService } from './workout-plans.service';
import { CreateWorkoutPlanDto, UpdateWorkoutPlanDto, CreateWorkoutAssignmentDto, LogWorkoutDayDto } from './dto/workout-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('workout-plans')
export class WorkoutPlansController {
  constructor(private plans: WorkoutPlansService) {}

  @Get()
  @Roles('ADMIN', 'TRAINER', 'MEMBER')
  findAll(@CurrentUser() user: User) {
    return this.plans.findAll(user.gymId, user.role, user.id);
  }

  @Get('assignments')
  @Roles('ADMIN', 'TRAINER', 'MEMBER')
  getAssignments(@CurrentUser() user: User, @Query('memberId') memberId?: string) {
    return this.plans.getAssignments(user.gymId, user.role, user.id, memberId);
  }

  @Get(':id')
  @Roles('ADMIN', 'TRAINER', 'MEMBER')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.plans.findOne(user.gymId, id, user.role, user.id);
  }

  @Post()
  @Roles('ADMIN', 'TRAINER')
  create(@CurrentUser() user: User, @Body() dto: CreateWorkoutPlanDto) {
    return this.plans.create(user.gymId, user.id, dto);
  }

  @Put(':id')
  @Roles('ADMIN', 'TRAINER')
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateWorkoutPlanDto) {
    return this.plans.update(user.gymId, id, dto, user.role, user.id);
  }

  @Delete(':id')
  @Roles('ADMIN', 'TRAINER')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.plans.remove(user.gymId, id, user.role, user.id);
  }

  @Post('assignments')
  @Roles('ADMIN', 'TRAINER')
  assign(@CurrentUser() user: User, @Body() dto: CreateWorkoutAssignmentDto) {
    return this.plans.assign(user.gymId, dto, user.role, user.id);
  }

  @Delete('assignments/:id')
  @Roles('ADMIN', 'TRAINER')
  removeAssignment(@CurrentUser() user: User, @Param('id') id: string) {
    return this.plans.removeAssignment(user.gymId, id);
  }

  @Post('assignments/:assignmentId/day-logs')
  @Roles('ADMIN', 'TRAINER', 'MEMBER')
  logDay(@CurrentUser() user: User, @Param('assignmentId') assignmentId: string, @Body() dto: LogWorkoutDayDto) {
    return this.plans.logDay(user.gymId, assignmentId, dto.date, user.role, user.id);
  }

  @Delete('assignments/:assignmentId/day-logs')
  @Roles('ADMIN', 'TRAINER', 'MEMBER')
  unlogDay(@CurrentUser() user: User, @Param('assignmentId') assignmentId: string, @Query('date') date: string) {
    return this.plans.unlogDay(user.gymId, assignmentId, date, user.role, user.id);
  }

  @Get('assignments/:assignmentId/day-logs')
  @Roles('ADMIN', 'TRAINER', 'MEMBER')
  getDayLogs(@CurrentUser() user: User, @Param('assignmentId') assignmentId: string) {
    return this.plans.getDayLogs(user.gymId, assignmentId, user.role, user.id);
  }
}
