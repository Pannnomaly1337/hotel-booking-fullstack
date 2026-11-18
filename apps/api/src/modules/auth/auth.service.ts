import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { createHash, randomUUID } from "crypto";
import { User } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

interface RefreshPayload {
  sub: string;
  family: string;
  jti: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async validateCredentials(email: string, password: string): Promise<User> {
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const matched = await bcrypt.compare(password, user.passwordHash);
    if (!matched) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Account is disabled");
    }
    return user;
  }

  async issueTokens(user: User): Promise<IssuedTokens> {
    return this.signAndStore(user, randomUUID());
  }

  async signAndStore(user: User, family: string): Promise<IssuedTokens> {
    // access
    const accessToken = this.jwt.sign({ sub: user.id, role: user.role });

    // refresh
    const refreshToken = this.jwt.sign(
      { sub: user.id, family, jti: randomUUID() },
      {
        secret: this.config.get<string>("JWT_REFRESH_SECRET"),
        expiresIn: this.config.get<string>("JWT_REFRESH_EXPIRES") ?? "7d",
      },
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        family,
        expiresAt: this.decodeExpiry(refreshToken),
      },
    });

    return { accessToken, refreshToken };
  }

  async rotateRefresh(oldToken: string): Promise<{ user: User; tokens: IssuedTokens }> {
    let payload: RefreshPayload;
    try {
      payload = this.jwt.verify<RefreshPayload>(oldToken, {
        secret: this.config.get<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const tokenHash = this.hashToken(oldToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!record) {
      throw new UnauthorizedException("Refresh token not recognized");
    }

    if (record.revokedAt) {
      await this.revokeFamily(record.family);
      throw new UnauthorizedException("Refresh token reuse detected");
    }

    if (record.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token expired");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("User not found or disabled");
    }

    await this.prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
    const tokens = await this.signAndStore(user, record.family);
    return { user, tokens };
  }

  async revokeFamily(family: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeRefreshToken(token: string | undefined): Promise<void> {
    if (!token) return;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private decodeExpiry(token: string): Date {
    const decoded = this.jwt.decode(token) as { exp?: number } | null;
    return decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
}