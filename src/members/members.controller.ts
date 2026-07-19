import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberDto, UpdateMemberDto, LinkMemberDto, UpdateMemberProfileDto } from './dto/member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('members')
export class MembersController {
  constructor(private members: MembersService) {}

  @Get('me')
  @Roles('MEMBER')
  findMe(@CurrentUser() user: User) {
    return this.members.findMe(user.id);
  }

  @Put('me')
  @Roles('MEMBER')
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateMemberProfileDto) {
    return this.members.updateMe(user.id, dto);
  }

  @Get()
  @Roles('ADMIN', 'TRAINER')
  findAll(@CurrentUser() user: User, @Query('trainerId') trainerId?: string) {
    return this.members.findAll(user.gymId, user.role, user.id, trainerId);
  }

  @Get(':id')
  @Roles('ADMIN', 'TRAINER')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.members.findOne(user.gymId, id, user.role, user.id);
  }

  @Post()
  @Roles('ADMIN')
  create(@CurrentUser() user: User, @Body() dto: CreateMemberDto) {
    return this.members.create(user.gymId, dto);
  }

  @Put(':id')
  @Roles('ADMIN')
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.members.update(user.gymId, id, dto);
  }

  @Post('link')
  @Roles('ADMIN')
  linkMember(@CurrentUser() user: User, @Body() dto: LinkMemberDto) {
    return this.members.linkByEmail(user.gymId!, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.members.remove(user.gymId, id);
  }
}
