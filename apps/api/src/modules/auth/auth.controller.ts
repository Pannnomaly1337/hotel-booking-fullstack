import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import { Response } from "express";
import { Public } from "../../common/decorators/public.decorator";
import {
  CurrentUser,
  AuthUser,
} from "../../common/decorators/current-user.decorator";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { authCookieOptions } from "./cookie.util";
import { LoginDto } from "./dto/login.dto";

// Paths preserved from the original API so the frontend changes stay minimal:
//   POST /api/v1/users/auth/cookie/login
//   POST /api/v1/users/auth/cookie/logout
//   GET  /api/v1/users/auth/cookie/me
@Controller("users/auth/cookie")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // brute-force protection on login
  @HttpCode(200)
  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.auth.validateCredentials(dto.email, dto.password);
    const token = this.auth.signToken(user.id, user.role);

    const isProd = this.config.get("NODE_ENV") === "production";
    res.cookie(
      "accessToken",
      token,
      authCookieOptions(isProd, this.config.get("COOKIE_DOMAIN")),
    );

    return {
      success: true,
      message: "login successfully",
      user: this.users.toPublicUser(user),
    };
  }

  @Public()
  @HttpCode(200)
  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response) {
    const isProd = this.config.get("NODE_ENV") === "production";
    res.clearCookie(
      "accessToken",
      authCookieOptions(isProd, this.config.get("COOKIE_DOMAIN")),
    );
    return { success: true, message: "logged out successfully" };
  }

  @Get("me")
  async me(@CurrentUser() current: AuthUser) {
    const user = await this.users.findByIdOrThrow(current.id);
    return { success: true, user: this.users.toPublicUser(user) };
  }
}
