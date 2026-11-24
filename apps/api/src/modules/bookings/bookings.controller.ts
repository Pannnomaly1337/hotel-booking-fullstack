import { Body, Controller, Get, HttpCode, Param, Post } from "@nestjs/common";
import {
  CurrentUser,
  AuthUser,
} from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { BookingsService } from "./bookings.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { CheckInDto } from "./dto/check-in.dto";

@Controller("bookings")
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post()
  async create(
    @Body() dto: CreateBookingDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.bookings.create(dto, user);
    return { success: true, data };
  }

  @Roles("frontdesk", "manager", "admin")
  @Post("walk-in")
  async walkIn(@Body() dto: CreateBookingDto, @CurrentUser() staff: AuthUser) {
    const data = await this.bookings.createWalkIn(dto, staff);
    return { success: true, data };
  }

  @Get()
  async mine(@CurrentUser() user: AuthUser) {
    const data = await this.bookings.findMine(user);
    return { success: true, data };
  }

  @Get(":id")
  async detail(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const data = await this.bookings.findOne(id, user);
    return { success: true, data };
  }

  @HttpCode(200)
  @Post(":id/cancel")
  async cancel(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const data = await this.bookings.cancel(id, user);
    return { success: true, data };
  }

  @Roles("frontdesk", "manager", "admin")
  @HttpCode(200)
  @Post(":id/check-in")
  async checkIn(
    @Param("id") id: string,
    @Body() dto: CheckInDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.bookings.checkIn(id, dto, user);
    return { success: true, data };
  }

  @Roles("frontdesk", "manager", "admin")
  @HttpCode(200)
  @Post(":id/check-out")
  async checkOut(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const data = await this.bookings.checkOut(id, user);
    return { success: true, data };
  }
}
