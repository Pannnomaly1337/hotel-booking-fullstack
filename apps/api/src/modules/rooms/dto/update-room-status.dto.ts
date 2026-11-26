import { IsIn } from "class-validator";
import { RoomStatus } from "@repo/types";

export class UpdateRoomStatusDto {
  @IsIn(Object.values(RoomStatus))
  status!: RoomStatus;
}
