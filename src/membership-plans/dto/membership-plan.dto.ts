import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { DurationType } from '@prisma/client';

export class CreateMembershipPlanDto {
  @IsString() name: string;
  @IsNumber() durationValue: number;
  @IsEnum(DurationType) durationType: DurationType;
  @IsNumber() price: number;
  @IsOptional() @IsArray() @IsString({ each: true }) perks?: string[];
}

export class UpdateMembershipPlanDto extends CreateMembershipPlanDto {}
