import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateRoomDto } from "./dto/create-room.dto";
import { UpdateRoomDto } from "./dto/update-room.dto";

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoomDto) {
    try {
      return await this.prisma.room.create({ data: dto });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new ConflictException("Room number already exists");
      }
      throw e;
    }
  }

  async findAll() {
    return this.prisma.room.findMany({
      orderBy: { roomNumber: "asc" },
      include: {
        currentGuest: { select: { id: true, firstname: true, lastname: true } },
      },
    });
  }

  async findOne(roomNumber: number) {
    const room = await this.prisma.room.findUnique({
      where: { roomNumber },
      include: {
        currentGuest: { select: { id: true, firstname: true, lastname: true } },
      },
    });
    if (!room) throw new NotFoundException("Room not found");
    return room;
  }

  async update(roomNumber: number, dto: UpdateRoomDto) {
    await this.findOne(roomNumber);
    try {
      return await this.prisma.room.update({
        where: { roomNumber },
        data: dto,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new ConflictException("Room number already exists");
      }
      throw e;
    }
  }

  async remove(roomNumber: number) {
    await this.findOne(roomNumber);
    await this.prisma.room.delete({ where: { roomNumber } });
  }
}
