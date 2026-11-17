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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** ตรวจ credentials — โยน 401 เหมือนกันหมดไม่ว่า email ผิดหรือ password ผิด (กัน user enumeration) */
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

  /** login ใหม่ = สร้าง family ใหม่ (1 family = 1 session/เครื่อง) */
  async issueTokens(user: User): Promise<IssuedTokens> {
    return this.signAndStore(user, randomUUID());
  }

  /**
   * เซ็น access + refresh แล้วเก็บ hash ของ refresh ลง DB
   * chunk c (rotate) จะเรียกซ้ำโดยส่ง family เดิมมา เพื่อสืบสาย session
   */
  async signAndStore(user: User, family: string): Promise<IssuedTokens> {
    // access: ใช้ default ของ JwtModule (secret + อายุ 15m)
    const accessToken = this.jwt.sign({ sub: user.id, role: user.role });

    // refresh: secret แยก + อายุยาว, ฝัง family + jti (id เฉพาะของใบนี้)
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

  /** sha256 ของ token — เก็บ hash ไม่เก็บ token ดิบ (ถ้า DB รั่ว token ที่ขโมยไปใช้ไม่ได้) */
  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  /** ดึงเวลาหมดอายุจาก token (exp เป็น unix วินาที) ไปเก็บใน DB */
  private decodeExpiry(token: string): Date {
    const decoded = this.jwt.decode(token) as { exp?: number } | null;
    return decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
}
