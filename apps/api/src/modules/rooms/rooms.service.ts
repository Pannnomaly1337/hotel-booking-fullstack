import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { RoomStatus } from "@repo/types";
import { PrismaService } from "../../prisma/prisma.service";
import { SearchAvailabilityDto } from "./dto/search-availability.dto";
import { ListRoomsDto } from "./dto/list-rooms.dto";

const ALLOWED_ROOM_TRANSITIONS: Record<RoomStatus, RoomStatus[]> = {
  cleaning: ["available", "maintenance"],
  maintenance: ["available"],
  available: ["maintenance"],
  occupied: [],
  reserved: [],
};

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async listRoomTypes() {
    return this.prisma.roomType.findMany({
      orderBy: { basePrice: "asc" },
      include: { _count: { select: { rooms: true } } },
    });
  }

  async getRoomType(slug: string) {
    const type = await this.prisma.roomType.findUnique({
      where: { slug },
      include: { _count: { select: { rooms: true } } },
    });
    if (!type) throw new NotFoundException("Room type not found");
    return type;
  }

  async availableRoomCount(
    roomTypeId: string,
    checkIn: Date,
    checkOut: Date,
  ): Promise<number> {
    const total = await this.prisma.room.count({ where: { roomTypeId } });
    const occupied = await this.prisma.booking.count({
      where: {
        roomTypeId,
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
        OR: [
          { status: { in: ["confirmed", "checked_in"] } },
          { status: "pending", expiresAt: { gt: new Date() } },
        ],
      },
    });
    return total - occupied;
  }

  async searchAvailability(dto: SearchAvailabilityDto) {
    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);

    if (checkOut <= checkIn) {
      throw new BadRequestException("checkOut must be after checkIn");
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkIn < today) {
      throw new BadRequestException("checkIn cannot be in the past");
    }

    const types = await this.prisma.roomType.findMany({
      orderBy: { basePrice: "asc" },
    });

    const results = await Promise.all(
      types.map(async (t) => ({
        ...t,
        availableRooms: await this.availableRoomCount(t.id, checkIn, checkOut),
      })),
    );

    const adults = dto.adults ?? 1;
    const children = dto.children ?? 0;
    return results.filter(
      (r) =>
        r.availableRooms > 0 &&
        r.maxAdults >= adults &&
        r.maxChildren >= children,
    );
  }

  async listRooms(filters: ListRoomsDto) {
    return this.prisma.room.findMany({
      where: {
        status: filters.status,
        floor: filters.floor,
        roomTypeId: filters.roomTypeId,
      },
      orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
      include: { roomType: { select: { name: true, slug: true } } },
    });
  }

  async updateRoomStatus(id: string, status: RoomStatus) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundException("Room not found");

    if (room.status === status) return room;

    const allowed = ALLOWED_ROOM_TRANSITIONS[room.status as RoomStatus] ?? [];
    if (!allowed.includes(status)) {
      const hint =
        room.status === "occupied" || room.status === "reserved"
          ? " — ห้องมีคนพัก/ถูกจองอยู่ เปลี่ยนผ่าน check-in/check-out เท่านั้น"
          : "";
      throw new ConflictException(
        `Cannot change room status from ${room.status} to ${status}${hint}`,
      );
    }

    return this.prisma.room.update({ where: { id }, data: { status } });
  }
}
