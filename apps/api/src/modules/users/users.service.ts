import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, User } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { PublicUser, Role } from "@repo/types";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { AuthUser } from "../../common/decorators/current-user.decorator";

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** ตัด passwordHash ออกก่อนส่งให้ client เสมอ (map field ตาม PublicUser) */
  toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role as Role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async findAll(): Promise<PublicUser[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return users.map((u) => this.toPublicUser(u));
  }

  async findOne(id: string): Promise<PublicUser> {
    const user = await this.findByIdOrThrow(id);
    return this.toPublicUser(user);
  }

  /** สมัครสมาชิก — role ไม่รับจาก input → default "customer" ใน DB */
  async create(dto: CreateUserDto): Promise<PublicUser> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    try {
      const user = await this.prisma.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email.trim().toLowerCase(),
          phone: dto.phone,
          passwordHash,
          // role เว้นไว้ → default customer (กัน self-escalate)
        },
      });
      return this.toPublicUser(user);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new ConflictException("Email already in use");
      }
      throw e;
    }
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    requester: AuthUser,
  ): Promise<PublicUser> {
    // แก้ได้เฉพาะตัวเอง หรือ admin
    if (requester.role !== "admin" && requester.id !== id) {
      throw new ForbiddenException("You cannot modify another user");
    }
    // เปลี่ยน role ได้เฉพาะ admin (กัน privilege escalation)
    if (dto.role !== undefined && requester.role !== "admin") {
      throw new ForbiddenException("You cannot change your role");
    }

    await this.findByIdOrThrow(id);

    const data: Prisma.UserUpdateInput = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.email !== undefined) data.email = dto.email.trim().toLowerCase();
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.password !== undefined) {
      data.passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    }

    try {
      const updated = await this.prisma.user.update({ where: { id }, data });
      return this.toPublicUser(updated);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new ConflictException("Email already in use");
      }
      throw e;
    }
  }

  async remove(id: string, requester: AuthUser): Promise<void> {
    if (requester.role !== "admin" && requester.id !== id) {
      throw new ForbiddenException("You cannot delete another user");
    }
    await this.findByIdOrThrow(id);
    await this.prisma.user.delete({ where: { id } });
  }
}
