import { IsIn, IsOptional } from "class-validator";
import { BookingStatus } from "@repo/types";

export class FindBookingsDto {
  @IsOptional()
  @IsIn(Object.values(BookingStatus))
  status?: BookingStatus;
}
