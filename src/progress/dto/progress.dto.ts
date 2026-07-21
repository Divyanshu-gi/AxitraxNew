import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMeasurementDto {
  @IsOptional() @IsNumber() weightKg?: number;
  @IsOptional() @IsNumber() bodyFatPercent?: number;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsString() recordedAt?: string;
}
