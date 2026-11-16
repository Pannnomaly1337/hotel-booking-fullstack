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

  /** Strip the password hash before returning a user to any client. */
  toPublicUser(user: User): PublicUser {
    const { password: _password, ...rest } = user;
    return {
      ...rest,
      role: rest.role as Role,
      createdAt: rest.createdAt.toISOString(),
      updatedAt: rest.updatedAt.toISOString(),
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

  async create(dto: CreateUserDto): Promise<PublicUser> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    try {
      const user = await this.prisma.user.create({
        data: {
          firstname: dto.firstname,
          lastname: dto.lastname,
          email: dto.email.trim().toLowerCase(),
          password: passwordHash,
          // role intentionally omitted — defaults to "user"
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
    // Only self or admin may update.
    if (requester.role !== "admin" && requester.id !== id) {
      throw new ForbiddenException("You cannot modify another user");
    }
    // Only admins may change roles (privilege-escalation guard).
    if (dto.role !== undefined && requester.role !== "admin") {
      throw new ForbiddenException("You cannot change your role");
    }

    await this.findByIdOrThrow(id);

    const data: Prisma.UserUpdateInput = {};
    if (dto.firstname !== undefined) data.firstname = dto.firstname;
    if (dto.lastname !== undefined) data.lastname = dto.lastname;
    if (dto.imagelink !== undefined) data.imagelink = dto.imagelink;
    if (dto.detail !== undefined) data.detail = dto.detail;
    if (dto.email !== undefined) data.email = dto.email.trim().toLowerCase();
    if (dto.role !== undefined) data.role = dto.role;
    // Re-hash the password here — the original lost this when switching to
    // findByIdAndUpdate, storing plaintext. Never again.
    if (dto.password !== undefined) {
      data.password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
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
