import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { RoomsService } from "./rooms.service";
import { ListRoomsDto } from "./dto/list-rooms.dto";
import { UpdateRoomStatusDto } from "./dto/update-room-status.dto";


@Controller("rooms")
export class RoomsOpsController {
  constructor(private readonly rooms: RoomsService) {}

  @Roles("frontdesk", "housekeeping", "manager", "admin")
  @Get()
  async list(@Query() dto: ListRoomsDto) {
    const data = await this.rooms.listRooms(dto);
    return { success: true, data };
  }

  @Roles("housekeeping", "manager", "admin")
  @Patch(":id/status")
  async updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateRoomStatusDto,
  ) {
    const data = await this.rooms.updateRoomStatus(id, dto.status);
    return { success: true, data };
  }
}
