import {
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateBookingDto {
  @IsString()
  roomTypeId!: string;

  @IsDateString()
  checkIn!: string; // YYYY-MM-DD

  @IsDateString()
  checkOut!: string;

  @IsInt()
  @Min(1)
  @Max(10)
  adults!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  children?: number;

  // ผู้เข้าพัก (อาจไม่ใช่คนจอง) — PII
  @IsString()
  @MaxLength(100)
  guestFirstName!: string;

  @IsString()
  @MaxLength(100)
  guestLastName!: string;

  @IsEmail()
  guestEmail!: string;

  @IsString()
  @MaxLength(20)
  guestPhone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  guestCountry?: string; // "TH"

  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialRequest?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  estimatedArrival?: string;
}
