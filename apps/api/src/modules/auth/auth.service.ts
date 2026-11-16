import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Verify credentials. Throws 401 on any failure (no user enumeration hints). */
  async validateCredentials(email: string, password: string) {
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Same generic error whether the user is missing or the password is wrong.
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const matched = await bcrypt.compare(password, user.password);
    if (!matched) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return user;
  }

  signToken(userId: string, role: string): string {
    return this.jwt.sign({ sub: userId, role });
  }
}
