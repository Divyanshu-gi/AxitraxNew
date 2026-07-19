import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { MembershipStatus } from '@prisma/client';

export class CreateMemberDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() goal?: string;
  @IsOptional() @IsUUID() trainerId?: string;
  @IsOptional() @IsUUID() membershipPlanId?: string;
  @IsOptional() @IsEnum(MembershipStatus) status?: MembershipStatus;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() renewalDate?: string;
  @IsOptional() @IsNumber() amountPaid?: number;
  @IsOptional() @IsNumber() discount?: number;
  @IsOptional() @IsString() dateOfBirth?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsNumber() heightFeet?: number;
  @IsOptional() @IsNumber() weightKg?: number;
  @IsOptional() @IsString() emergencyContactName?: string;
  @IsOptional() @IsString() emergencyContactPhone?: string;
  @IsOptional() @IsString() emergencyContactRelationship?: string;
  @IsString() @IsOptional() password?: string;
}

export class UpdateMemberDto extends CreateMemberDto {}

export class UpdateMemberProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() dateOfBirth?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsNumber() heightFeet?: number;
  @IsOptional() @IsNumber() weightKg?: number;
  @IsOptional() @IsNumber() bodyFatPercent?: number;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() emergencyContactName?: string;
  @IsOptional() @IsString() emergencyContactPhone?: string;
  @IsOptional() @IsString() emergencyContactRelationship?: string;
}

export class LinkMemberDto {
  @IsEmail() email: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() goal?: string;
  @IsOptional() @IsUUID() trainerId?: string;
  @IsOptional() @IsUUID() membershipPlanId?: string;
  @IsOptional() @IsEnum(MembershipStatus) status?: MembershipStatus;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() renewalDate?: string;
  @IsOptional() @IsNumber() amountPaid?: number;
  @IsOptional() @IsNumber() discount?: number;
}
