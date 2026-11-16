import { IsIn, IsOptional } from "class-validator";
import { PartialType } from "@nestjs/mapped-types";
import { RoomStatus } from "@repo/types";
import { CreateRoomDto } from "./create-room.dto";

export class UpdateRoomDto extends PartialType(CreateRoomDto) {
  @IsOptional()
  @IsIn(["Available", "Occupied", "Reserved", "Cleaning", "Maintenance"])
  status?: RoomStatus;
}
