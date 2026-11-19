import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { SearchAvailabilityDto } from "./dto/search-availability.dto";

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  /** list ประเภทห้องทั้งหมด + จำนวนห้องของแต่ละประเภท */
  async listRoomTypes() {
    return this.prisma.roomType.findMany({
      orderBy: { basePrice: "asc" },
      include: { _count: { select: { rooms: true } } },
    });
  }

  /** รายละเอียดประเภทห้องตาม slug */
  async getRoomType(slug: string) {
    const type = await this.prisma.roomType.findUnique({
      where: { slug },
      include: { _count: { select: { rooms: true } } },
    });
    if (!type) throw new NotFoundException("Room type not found");
    return type;
  }

  /**
   * จำนวนห้องว่างของ type ในช่วงวัน = ห้องทั้งหมด − ห้องที่ถูกจองทับช่วง (ADR-002)
   * "ถูกจอง" = confirmed/checked_in  หรือ  pending ที่ "ยังไม่หมดอายุ" (hold 15 นาที)
   * → pending ที่หมดอายุแล้วจะหยุดนับเอง = ปล่อยห้องคืนอัตโนมัติ โดยไม่ต้องมี cron (ADR-008)
   * ใช้ร่วมกันทั้งตอนค้นห้อง (M1.3) และตอนสร้าง booking (M1.4)
   */
  async availableRoomCount(
    roomTypeId: string,
    checkIn: Date,
    checkOut: Date,
  ): Promise<number> {
    const total = await this.prisma.room.count({ where: { roomTypeId } });
    const occupied = await this.prisma.booking.count({
      where: {
        roomTypeId,
        // ช่วงทับกัน: existingCheckIn < newCheckOut AND existingCheckOut > newCheckIn
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

  /** ค้นประเภทห้องที่ยังว่างในช่วงวัน + รับจำนวนผู้เข้าพักได้ */
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
}
