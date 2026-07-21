import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MembersModule } from './members/members.module';
import { TrainersModule } from './trainers/trainers.module';
import { MembershipPlansModule } from './membership-plans/membership-plans.module';
import { WorkoutPlansModule } from './workout-plans/workout-plans.module';
import { DietPlansModule } from './diet-plans/diet-plans.module';
import { AttendanceModule } from './attendance/attendance.module';
import { RemindersModule } from './reminders/reminders.module';
import { ProgressModule } from './progress/progress.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    MembersModule,
    TrainersModule,
    MembershipPlansModule,
    WorkoutPlansModule,
    DietPlansModule,
    AttendanceModule,
    RemindersModule,
    ProgressModule,
  ],
})
export class AppModule {}
