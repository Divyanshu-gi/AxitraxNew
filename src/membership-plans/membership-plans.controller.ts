import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MembershipPlansService } from './membership-plans.service';
import { CreateMembershipPlanDto, UpdateMembershipPlanDto } from './dto/membership-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('membership-plans')
export class MembershipPlansController {
  constructor(private plans: MembershipPlansService) {}

  @Get()
  @Roles('ADMIN', 'TRAINER', 'MEMBER')
  findAll(@CurrentUser() user: User) {
    return this.plans.findAll(user.gymId);
  }

  @Get(':id')
  @Roles('ADMIN', 'TRAINER', 'MEMBER')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.plans.findOne(user.gymId, id);
  }

  @Post()
  @Roles('ADMIN')
  create(@CurrentUser() user: User, @Body() dto: CreateMembershipPlanDto) {
    return this.plans.create(user.gymId, dto);
  }

  @Put(':id')
  @Roles('ADMIN')
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateMembershipPlanDto) {
    return this.plans.update(user.gymId, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.plans.remove(user.gymId, id);
  }
}
