import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/reminder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reminders')
export class RemindersController {
  constructor(private reminders: RemindersService) {}

  @Get()
  @Roles('ADMIN', 'TRAINER', 'MEMBER')
  findAll(@CurrentUser() user: User) {
    return this.reminders.findAll(user.gymId, user.role);
  }

  @Post()
  @Roles('ADMIN', 'TRAINER')
  create(@CurrentUser() user: User, @Body() dto: CreateReminderDto) {
    return this.reminders.create(user.gymId, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'TRAINER')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.reminders.remove(user.gymId, id);
  }
}
