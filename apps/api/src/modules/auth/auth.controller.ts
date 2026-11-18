import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import { Request, Response } from "express";
import { Public } from "../../common/decorators/public.decorator";
import {
  CurrentUser,
  AuthUser,
} from "../../common/decorators/current-user.decorator";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { accessCookieOptions, refreshCookieOptions } from "./cookie.util";
import { LoginDto } from "./dto/login.dto";

@Controller("users/auth/cookie")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
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
  @Post("refresh")
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.refreshToken as string | undefined;
    if (!token) {
      throw new UnauthorizedException("No refresh token");
    }
    try {
      const { user, tokens } = await this.auth.rotateRefresh(token);
      this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
      return { success: true, user: this.users.toPublicUser(user) };
    } catch (e) {
      this.clearAuthCookies(res);
      throw e;
    }
  }

  @Public()
  @HttpCode(200)
  @Post("logout")
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.revokeRefreshToken(
      req.cookies?.refreshToken as string | undefined,
    );
    this.clearAuthCookies(res);
    return { success: true, message: "logged out successfully" };
  }

  @Get("me")
  async me(@CurrentUser() current: AuthUser) {
    const user = await this.users.findByIdOrThrow(current.id);
    return { success: true, user: this.users.toPublicUser(user) };
  }

  // ---- cookie helpers ----

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

  private clearAuthCookies(res: Response) {
    const isProd = this.config.get("NODE_ENV") === "production";
    const domain = this.config.get<string>("COOKIE_DOMAIN");
    res.clearCookie("accessToken", accessCookieOptions(isProd, domain));
    res.clearCookie("refreshToken", refreshCookieOptions(isProd, domain));
  }
}