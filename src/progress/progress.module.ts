import { Module } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [AttendanceModule],
  providers: [ProgressService],
  controllers: [ProgressController],
})
export class ProgressModule {}
