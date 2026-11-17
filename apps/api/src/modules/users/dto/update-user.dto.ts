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
 * Update input — `role` รับได้ แต่ service จะ apply เฉพาะตอน requester เป็น admin
 * (กัน user ธรรมดายกระดับตัวเอง) ValidationPipe (whitelist + forbidNonWhitelisted)
 * ตัด field แปลกปลอมทิ้ง → mass-assignment คอลัมน์ที่ไม่ได้ประกาศเป็นไปไม่ได้
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @IsOptional()
  @IsIn(["customer", "frontdesk", "housekeeping", "manager", "admin"])
  role?: Role;
}
