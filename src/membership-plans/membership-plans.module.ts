import { Module } from '@nestjs/common';
import { MembershipPlansService } from './membership-plans.service';
import { MembershipPlansController } from './membership-plans.controller';

@Module({
  providers: [MembershipPlansService],
  controllers: [MembershipPlansController],
})
export class MembershipPlansModule {}
