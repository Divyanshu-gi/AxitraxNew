import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateTrainerDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() specialization?: string;
  @IsOptional() @IsString() password?: string;
}

export class UpdateTrainerDto extends CreateTrainerDto {}
