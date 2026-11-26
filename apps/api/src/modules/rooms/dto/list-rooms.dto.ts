import { IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";
import { RoomStatus } from "@repo/types";

export class ListRoomsDto {
  @IsOptional()
  @IsIn(Object.values(RoomStatus))
  status?: RoomStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  floor?: number;

  @IsOptional()
  @IsString()
  roomTypeId?: string;
}
