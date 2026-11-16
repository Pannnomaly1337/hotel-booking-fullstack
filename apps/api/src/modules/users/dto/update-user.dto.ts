import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { Role } from "@repo/types";

/**
 * Update input. `role` is accepted here but the service only applies it
 * when the requester is an admin — a regular user cannot escalate.
 * ValidationPipe (whitelist + forbidNonWhitelisted) strips any other
 * field, so mass-assignment of unknown columns is impossible.
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imagelink?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  detail?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @IsOptional()
  @IsIn(["user", "admin"])
  role?: Role;
}
