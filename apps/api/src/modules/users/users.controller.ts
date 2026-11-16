import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { Public } from "../../common/decorators/public.decorator";
import {
  CurrentUser,
  AuthUser,
} from "../../common/decorators/current-user.decorator";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // Public registration.
  @Public()
  @Post()
  async register(@Body() dto: CreateUserDto) {
    const data = await this.users.create(dto);
    return { success: true, data };
  }

  // Admin-only: list every user.
  @Roles("admin")
  @Get()
  async findAll() {
    const data = await this.users.findAll();
    return { success: true, data };
  }

  // Self or admin.
  @Get(":id")
  async findOne(@Param("id") id: string, @CurrentUser() current: AuthUser) {
    if (current.role !== "admin" && current.id !== id) {
      throw new ForbiddenException("You cannot view another user");
    }
    const data = await this.users.findOne(id);
    return { success: true, data };
  }

  // Self or admin (role change: admin only — enforced in the service).
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() current: AuthUser,
  ) {
    const data = await this.users.update(id, dto, current);
    return { success: true, data };
  }

  // Self or admin.
  @Delete(":id")
  @HttpCode(200)
  async remove(@Param("id") id: string, @CurrentUser() current: AuthUser) {
    await this.users.remove(id, current);
    return { success: true, data: null };
  }
}
