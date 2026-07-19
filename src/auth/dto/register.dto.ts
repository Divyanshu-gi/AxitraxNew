import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterGymDto {
  @IsString() @IsNotEmpty()
  gymName: string;

  @IsEmail()
  gymEmail: string;

  @IsString() @IsNotEmpty()
  adminName: string;

  @IsEmail()
  adminEmail: string;

  @IsString() @MinLength(8)
  password: string;
}

export class RegisterMemberDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString() @MinLength(8)
  password: string;
}

export class LoginDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString() @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @IsString() @IsNotEmpty()
  refreshToken: string;
}
