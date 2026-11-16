import {
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { BookingStatus } from "@repo/types";

export class UpdateBookingDto {
  @IsOptional()
  @IsDateString()
  checkInDate?: string;

  @IsOptional()
  @IsDateString()
  checkOutDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastname?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  specialRequest?: string;

  @IsOptional()
  @IsIn(["pending", "confirmed", "checked_in", "checked_out", "cancelled"])
  status?: BookingStatus;
}
