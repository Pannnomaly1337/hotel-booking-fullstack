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
import { accessCookieOptions, refreshCookieOptions } from "./cookie.util";
import { LoginDto } from "./dto/login.dto";

// Paths:
//   POST /api/v1/users/auth/cookie/login
//   POST /api/v1/users/auth/cookie/logout
//   GET  /api/v1/users/auth/cookie/me
//   (refresh จะเพิ่มใน chunk c)
@Controller("users/auth/cookie")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // กัน brute-force ที่ login
  @HttpCode(200)
  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.auth.validateCredentials(dto.email, dto.password);
    const { accessToken, refreshToken } = await this.auth.issueTokens(user);
    this.setAuthCookies(res, accessToken, refreshToken);
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
    // chunk c: จะ revoke refresh token ใน DB ด้วย — ตอนนี้เคลียร์ cookie ทั้งสอง
    const isProd = this.config.get("NODE_ENV") === "production";
    const domain = this.config.get<string>("COOKIE_DOMAIN");
    res.clearCookie("accessToken", accessCookieOptions(isProd, domain));
    res.clearCookie("refreshToken", refreshCookieOptions(isProd, domain));
    return { success: true, message: "logged out successfully" };
  }

  @Get("me")
  async me(@CurrentUser() current: AuthUser) {
    const user = await this.users.findByIdOrThrow(current.id);
    return { success: true, user: this.users.toPublicUser(user) };
  }

  /** ตั้ง cookie ทั้งสอง (chunk c จะเรียกใช้ซ้ำตอน refresh) */
  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const isProd = this.config.get("NODE_ENV") === "production";
    const domain = this.config.get<string>("COOKIE_DOMAIN");
    res.cookie("accessToken", accessToken, accessCookieOptions(isProd, domain));
    res.cookie(
      "refreshToken",
      refreshToken,
      refreshCookieOptions(isProd, domain),
    );
  }
}
