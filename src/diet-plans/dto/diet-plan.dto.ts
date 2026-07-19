import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { DietGoal, MealType, Weekday } from '@prisma/client';

export class MealItemDto {
  @IsString() name: string;
  @IsOptional() @IsString() quantity?: string;
  @IsOptional() @IsInt() calories?: number;
}

export class MealEntryDto {
  @IsEnum(MealType) mealType: MealType;
  @IsArray() @ValidateNested({ each: true }) @Type(() => MealItemDto)
  items: MealItemDto[];
}

export class DietPlanDayDto {
  @IsEnum(Weekday) weekday: Weekday;
  @IsArray() @ValidateNested({ each: true }) @Type(() => MealEntryDto)
  meals: MealEntryDto[];
}

export class CreateDietPlanDto {
  @IsString() name: string;
  @IsOptional() @IsEnum(DietGoal) goal?: DietGoal;
  @IsOptional() @IsInt() targetCalories?: number;
  @IsOptional() @IsInt() repeatWeeks?: number;
  @IsArray() @ValidateNested({ each: true }) @Type(() => DietPlanDayDto)
  days: DietPlanDayDto[];
}

export class UpdateDietPlanDto extends CreateDietPlanDto {}

export class CreateDietAssignmentDto {
  @IsString() memberId: string;
  @IsString() planId: string;
  @IsString() startDate: string;
  @IsString() endDate: string;
}
