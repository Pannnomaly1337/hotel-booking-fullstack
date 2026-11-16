import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BookingStatus, RoomStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { UpdateBookingDto } from "./dto/update-booking.dto";
import { AuthUser } from "../../common/decorators/current-user.decorator";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Which room status each booking status implies. */
const BOOKING_TO_ROOM_STATUS: Record<BookingStatus, RoomStatus> = {
  pending: "Reserved",
  confirmed: "Reserved",
  checked_in: "Occupied",
  checked_out: "Available",
  cancelled: "Available",
};

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  private nightsBetween(checkIn: Date, checkOut: Date): number {
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / MS_PER_DAY);
  }

  private generateConfirmationNumber(): string {
    const time = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 6);
    return `BK-${(time + rand).toUpperCase()}`;
  }

  /** CREATE — atomic: validate room, lock price, create booking, sync room. */
  async create(dto: CreateBookingDto, userId: string) {
    const checkIn = new Date(dto.checkInDate);
    const checkOut = new Date(dto.checkOutDate);
    if (checkOut <= checkIn) {
      throw new BadRequestException(
        "Check-out date must be at least one day after check-in date",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({ where: { id: dto.roomId } });
      if (!room) {
        throw new NotFoundException("Room not found");
      }
      if (room.status !== "Available") {
        throw new BadRequestException(
          `Room is currently ${room.status} and cannot be booked`,
        );
      }

      const nights = this.nightsBetween(checkIn, checkOut);
      const roomRate = room.roomRate; // price locked from the room
      const totalAmount = roomRate * nights;

      const booking = await tx.booking.create({
        data: {
          userId,
          roomId: dto.roomId,
          confirmationNumber: this.generateConfirmationNumber(),
          checkInDate: checkIn,
          checkOutDate: checkOut,
          nights,
          firstname: dto.firstname,
          lastname: dto.lastname,
          email: dto.email,
          phone: dto.phone,
          specialRequest: dto.specialRequest,
          roomRate,
          totalAmount,
          status: "pending",
        },
      });

      // New booking → room becomes Reserved, guest assigned.
      await tx.room.update({
        where: { id: dto.roomId },
        data: { status: "Reserved", currentGuestId: userId },
      });

      return booking;
    });
  }

  /** Admin — list all bookings. */
  async findAll() {
    return this.prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      include: { room: true },
    });
  }

  /** Current user's own bookings, paginated. */
  async findMine(userId: string, page = 1, limit = 3) {
    const skip = (page - 1) * limit;
    const [total, bookings] = await this.prisma.$transaction([
      this.prisma.booking.count({ where: { userId } }),
      this.prisma.booking.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          room: {
            select: {
              roomNumber: true,
              type: true,
              floor: true,
              roomRate: true,
              status: true,
              imagelink: true,
            },
          },
        },
      }),
    ]);

    return {
      data: bookings,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
    };
  }

  private async getOwnedBookingOrThrow(cnumber: string, requester: AuthUser) {
    const booking = await this.prisma.booking.findUnique({
      where: { confirmationNumber: cnumber },
    });
    if (!booking) throw new NotFoundException("Booking not found");

    if (requester.role !== "admin" && booking.userId !== requester.id) {
      throw new ForbiddenException(
        "You do not have permission to access this booking",
      );
    }
    return booking;
  }

  /** Read one — owner or admin. */
  async findOne(cnumber: string, requester: AuthUser) {
    const booking = await this.getOwnedBookingOrThrow(cnumber, requester);
    return this.prisma.booking.findUnique({
      where: { id: booking.id },
      include: { room: true },
    });
  }

  /** UPDATE — owner or admin; atomic recompute + room-status sync. */
  async update(cnumber: string, dto: UpdateBookingDto, requester: AuthUser) {
    const booking = await this.getOwnedBookingOrThrow(cnumber, requester);

    return this.prisma.$transaction(async (tx) => {
      const checkIn = dto.checkInDate
        ? new Date(dto.checkInDate)
        : booking.checkInDate;
      const checkOut = dto.checkOutDate
        ? new Date(dto.checkOutDate)
        : booking.checkOutDate;
      if (checkOut <= checkIn) {
        throw new BadRequestException(
          "Check-out date must be at least one day after check-in date",
        );
      }

      const nights = this.nightsBetween(checkIn, checkOut);
      const totalAmount = booking.roomRate * nights;
      const nextStatus = dto.status ?? booking.status;

      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          checkInDate: checkIn,
          checkOutDate: checkOut,
          nights,
          totalAmount,
          firstname: dto.firstname ?? booking.firstname,
          lastname: dto.lastname ?? booking.lastname,
          email: dto.email ?? booking.email,
          phone: dto.phone ?? booking.phone,
          specialRequest: dto.specialRequest ?? booking.specialRequest,
          status: nextStatus,
        },
      });

      // Keep the room in sync with the booking's new status.
      const roomStatus = BOOKING_TO_ROOM_STATUS[nextStatus];
      const clearGuest =
        nextStatus === "checked_out" || nextStatus === "cancelled";
      await tx.room.update({
        where: { id: booking.roomId },
        data: {
          status: roomStatus,
          currentGuestId: clearGuest ? null : booking.userId,
        },
      });

      return updated;
    });
  }

  /** DELETE — owner or admin; frees the room. */
  async remove(cnumber: string, requester: AuthUser) {
    const booking = await this.getOwnedBookingOrThrow(cnumber, requester);

    await this.prisma.$transaction(async (tx) => {
      await tx.booking.delete({ where: { id: booking.id } });
      await tx.room.update({
        where: { id: booking.roomId },
        data: { status: "Available", currentGuestId: null },
      });
    });
  }
}
