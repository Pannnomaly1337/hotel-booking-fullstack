import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from "class-validator";

/**
 * Registration input — ไม่มี field `role` เด็ดขาด
 * → client สมัครเองได้แค่ role "customer" (default ใน DB) กัน privilege escalation
 *   staff (frontdesk/housekeeping/manager/admin) สร้างโดย admin เท่านั้น
 */
export class CreateUserDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @MaxLength(128)
  password!: string;
}
