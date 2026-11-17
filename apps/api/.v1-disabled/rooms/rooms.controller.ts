import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RoomsService } from "./rooms.service";
import { CreateRoomDto } from "./dto/create-room.dto";
import { UpdateRoomDto } from "./dto/update-room.dto";

@Controller("rooms")
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  // Admin only — the original left this wide open to anyone.
  @Roles("admin")
  @Post()
  async create(@Body() dto: CreateRoomDto) {
    const data = await this.rooms.create(dto);
    return { success: true, data };
  }

  // Public browsing of rooms.
  @Public()
  @Get()
  async findAll() {
    const data = await this.rooms.findAll();
    return { success: true, data };
  }

  @Public()
  @Get(":roomNumber")
  async findOne(@Param("roomNumber", ParseIntPipe) roomNumber: number) {
    const data = await this.rooms.findOne(roomNumber);
    return { success: true, data };
  }

  @Roles("admin")
  @Patch(":roomNumber")
  async update(
    @Param("roomNumber", ParseIntPipe) roomNumber: number,
    @Body() dto: UpdateRoomDto,
  ) {
    const data = await this.rooms.update(roomNumber, dto);
    return { success: true, data };
  }

  @Roles("admin")
  @Delete(":roomNumber")
  @HttpCode(200)
  async remove(@Param("roomNumber", ParseIntPipe) roomNumber: number) {
    await this.rooms.remove(roomNumber);
    return { success: true, data: null };
  }
}
