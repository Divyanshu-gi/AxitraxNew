import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TrainersService } from './trainers.service';
import { CreateTrainerDto, UpdateTrainerDto } from './dto/trainer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('trainers')
export class TrainersController {
  constructor(private trainers: TrainersService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.trainers.findAll(user.gymId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.trainers.findOne(user.gymId, id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateTrainerDto) {
    return this.trainers.create(user.gymId, dto);
  }

  @Put(':id')
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateTrainerDto) {
    return this.trainers.update(user.gymId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.trainers.remove(user.gymId, id);
  }

  @Post(':id/assign/:memberId')
  assign(@CurrentUser() user: User, @Param('id') id: string, @Param('memberId') memberId: string) {
    return this.trainers.assignMember(user.gymId, id, memberId);
  }

  @Delete(':id/assign/:memberId')
  unassign(@CurrentUser() user: User, @Param('memberId') memberId: string) {
    return this.trainers.unassignMember(user.gymId, memberId);
  }
}
