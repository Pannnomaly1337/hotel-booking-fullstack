import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { RoomsService } from "../rooms/rooms.service";
import { PaymentsService } from "../payments/payments.service";
import { LockService } from "../../redis/lock.service";
import { assertCanAccess } from "../../common/auth/ownership.util";
import { AuthUser } from "../../common/decorators/current-user.decorator";
import { CreateBookingDto } from "./dto/create-booking.dto";

const TAX_RATE = new Prisma.Decimal("0.07"); // VAT 7%
const SERVICE_RATE = new Prisma.Decimal("0.10"); // service charge 10%
const PENDING_HOLD_MINUTES = 15;
const STAFF_ROLES = ["frontdesk", "manager", "admin"] as const;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rooms: RoomsService,
    private readonly lock: LockService,
    private readonly payments: PaymentsService,
  ) {}

  async create(dto: CreateBookingDto, booker: AuthUser) {
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

    const roomType = await this.prisma.roomType.findUnique({
      where: { id: dto.roomTypeId },
    });
    if (!roomType) throw new NotFoundException("Room type not found");

    const adults = dto.adults;
    const children = dto.children ?? 0;
    if (adults > roomType.maxAdults || children > roomType.maxChildren) {
      throw new BadRequestException("Guest count exceeds room capacity");
    }

    const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / MS_PER_DAY);

    const roomSubtotal = roomType.basePrice.mul(nights).toDecimalPlaces(2);
    const taxAmount = roomSubtotal.mul(TAX_RATE).toDecimalPlaces(2);
    const serviceCharge = roomSubtotal.mul(SERVICE_RATE).toDecimalPlaces(2);
    const totalAmount = roomSubtotal
      .add(taxAmount)
      .add(serviceCharge)
      .toDecimalPlaces(2);

    const expiresAt = new Date(Date.now() + PENDING_HOLD_MINUTES * 60 * 1000);

    return this.lock.withLock(`roomtype:${roomType.id}`, async () => {
      const available = await this.rooms.availableRoomCount(
        roomType.id,
        checkIn,
        checkOut,
      );
      if (available <= 0) {
        throw new ConflictException(
          "No rooms available for the selected dates",
        );
      }

      return this.prisma.booking.create({
        data: {
          confirmationNumber: this.generateConfirmationNumber(),
          channel: "online",
          roomTypeId: roomType.id,
          bookerId: booker.id,
          checkIn,
          checkOut,
          nights,
          adults,
          children,
          guestFirstName: dto.guestFirstName,
          guestLastName: dto.guestLastName,
          guestEmail: dto.guestEmail.trim().toLowerCase(),
          guestPhone: dto.guestPhone,
          guestCountry: dto.guestCountry ?? "TH",
          specialRequest: dto.specialRequest,
          estimatedArrival: dto.estimatedArrival,
          roomSubtotal,
          taxAmount,
          serviceCharge,
          totalAmount,
          status: "pending",
          expiresAt,
        },
      });
    });
  }

  async findMine(user: AuthUser) {
    return this.prisma.booking.findMany({
      where: { bookerId: user.id },
      orderBy: { createdAt: "desc" },
      include: { roomType: { select: { name: true, slug: true } } },
    });
  }

  async findOne(id: string, user: AuthUser) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { roomType: { select: { name: true, slug: true } } },
    });
    if (!booking) throw new NotFoundException("Booking not found");
    assertCanAccess(booking.bookerId, user, [...STAFF_ROLES]);
    return booking;
  }

  async cancel(id: string, user: AuthUser) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException("Booking not found");
    assertCanAccess(booking.bookerId, user, [...STAFF_ROLES]);

    if (booking.status !== "pending" && booking.status !== "confirmed") {
      throw new ConflictException(`Cannot cancel a ${booking.status} booking`);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (booking.checkIn <= today) {
      throw new ConflictException("Cannot cancel on or after the check-in date");
    }

    const refund = await this.payments.handleCancellationPayment(booking.id);

    const cancelled = await this.prisma.booking.update({
      where: { id },
      data: { status: "cancelled" },
    });
    return { ...cancelled, refund };
  }

  private generateConfirmationNumber(): string {
    return `HH-${randomBytes(4).toString("hex").toUpperCase()}`;
  }
}
