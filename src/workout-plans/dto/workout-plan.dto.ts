import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Weekday } from '@prisma/client';

export class ExerciseDto {
  @IsString() name: string;
  @IsOptional() @IsString() reps?: string;
  @IsOptional() @IsString() rest?: string;
  @IsOptional() @IsInt() orderIndex?: number;
}

export class WorkoutPlanDayDto {
  @IsEnum(Weekday) weekday: Weekday;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsInt() durationMinutes?: number;
  @IsArray() @ValidateNested({ each: true }) @Type(() => ExerciseDto)
  exercises: ExerciseDto[];
}

export class CreateWorkoutPlanDto {
  @IsString() title: string;
  @IsOptional() @IsString() level?: string;
  @IsOptional() @IsString() focus?: string;
  @IsOptional() @IsInt() repeatWeeks?: number;
  @IsArray() @ValidateNested({ each: true }) @Type(() => WorkoutPlanDayDto)
  days: WorkoutPlanDayDto[];
}

export class UpdateWorkoutPlanDto extends CreateWorkoutPlanDto {}

export class CreateWorkoutAssignmentDto {
  @IsString() memberId: string;
  @IsString() planId: string;
  @IsString() startDate: string;
  @IsString() endDate: string;
}
