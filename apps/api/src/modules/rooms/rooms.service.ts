import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { SearchAvailabilityDto } from "./dto/search-availability.dto";

const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed", "checked_in"] as const;

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
      include: { _count: { select: { rooms: true } } },
    });

    const results = await Promise.all(
      types.map(async (t) => {
        const overlapping = await this.prisma.booking.count({
          where: {
            roomTypeId: t.id,
            status: { in: [...ACTIVE_BOOKING_STATUSES] },
            checkIn: { lt: checkOut },
            checkOut: { gt: checkIn },
          },
        });
        const { _count, ...roomType } = t;
        return { ...roomType, availableRooms: _count.rooms - overlapping };
      }),
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
