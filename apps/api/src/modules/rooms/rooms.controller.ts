import { Controller, Get, Param, Query } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { RoomsService } from "./rooms.service";
import { SearchAvailabilityDto } from "./dto/search-availability.dto";

@Controller("room-types")
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @Public()
  @Get()
  async list() {
    const data = await this.rooms.listRoomTypes();
    return { success: true, data };
  }

  @Public()
  @Get("search")
  async search(@Query() dto: SearchAvailabilityDto) {
    const data = await this.rooms.searchAvailability(dto);
    return { success: true, data };
  }

  @Public()
  @Get(":slug")
  async detail(@Param("slug") slug: string) {
    const data = await this.rooms.getRoomType(slug);
    return { success: true, data };
  }
}
