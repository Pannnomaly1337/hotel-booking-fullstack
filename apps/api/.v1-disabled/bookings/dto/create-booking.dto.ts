import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

/**
 * Booking creation input. Note there is NO `userId` and NO `pricing` —
 * userId comes from the authenticated token, and roomRate / nights /
 * totalAmount are computed server-side from the room. This closes the
 * IDOR hole where anyone could book as any user and set their own price.
 */
export class CreateBookingDto {
  @IsString()
  roomId!: string;

  @IsDateString()
  checkInDate!: string;

  @IsDateString()
  checkOutDate!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstname!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastname!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  specialRequest?: string;
}
