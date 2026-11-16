import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Request } from "express";
import { Role } from "@repo/types";
import { AuthUser } from "../../common/decorators/current-user.decorator";

export interface JwtPayload {
  sub: string;
  role: Role;
}

/** Pull the JWT out of the httpOnly `accessToken` cookie. */
const cookieExtractor = (req: Request): string | null => {
  return req?.cookies?.accessToken ?? null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_SECRET"),
    });
  }

  validate(payload: JwtPayload): AuthUser {
    if (!payload?.sub) {
      throw new UnauthorizedException("Invalid token");
    }
    return { id: payload.sub, role: payload.role };
  }
}
