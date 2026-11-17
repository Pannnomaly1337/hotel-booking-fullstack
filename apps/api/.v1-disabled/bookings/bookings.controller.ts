import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import {
  CurrentUser,
  AuthUser,
} from "../../common/decorators/current-user.decorator";
import { BookingsService } from "./bookings.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { UpdateBookingDto } from "./dto/update-booking.dto";

@Controller("bookings")
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  // Must be declared before ":cnumber" so it isn't captured as a param.
  @Get("my-bookings")
  async myBookings(
    @CurrentUser() current: AuthUser,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(3), ParseIntPipe) limit: number,
  ) {
    const result = await this.bookings.findMine(current.id, page, limit);
    return { success: true, ...result };
  }

  // Create a booking as the logged-in user (userId from the token).
  @Post()
  async create(
    @Body() dto: CreateBookingDto,
    @CurrentUser() current: AuthUser,
  ) {
    const data = await this.bookings.create(dto, current.id);
    return { success: true, message: "Booking created successfully", data };
  }

  // Admin — every booking.
  @Roles("admin")
  @Get()
  async findAll() {
    const data = await this.bookings.findAll();
    return { success: true, data };
  }

  @Get(":cnumber")
  async findOne(
    @Param("cnumber") cnumber: string,
    @CurrentUser() current: AuthUser,
  ) {
    const data = await this.bookings.findOne(cnumber, current);
    return { success: true, data };
  }

  @Patch(":cnumber")
  async update(
    @Param("cnumber") cnumber: string,
    @Body() dto: UpdateBookingDto,
    @CurrentUser() current: AuthUser,
  ) {
    const data = await this.bookings.update(cnumber, dto, current);
    return { success: true, data };
  }

  @Delete(":cnumber")
  @HttpCode(200)
  async remove(
    @Param("cnumber") cnumber: string,
    @CurrentUser() current: AuthUser,
  ) {
    await this.bookings.remove(cnumber, current);
    return {
      success: true,
      message: "Deleted successfully; room status set to Available",
    };
  }
}
