import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, RoomType, BookingStatus } from "@prisma/client";
import { randomBytes } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { RoomsService } from "../rooms/rooms.service";
import { PaymentsService } from "../payments/payments.service";
import { LockService } from "../../redis/lock.service";
import { assertCanAccess } from "../../common/auth/ownership.util";
import { AuthUser } from "../../common/decorators/current-user.decorator";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { CheckInDto } from "./dto/check-in.dto";

const TAX_RATE = new Prisma.Decimal("0.07"); // VAT 7%
const SERVICE_RATE = new Prisma.Decimal("0.10"); // service charge 10%
const PENDING_HOLD_MINUTES = 15;
const STAFF_ROLES = ["frontdesk", "manager", "admin"] as const;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

type PricedBooking = {
  roomType: RoomType;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  adults: number;
  children: number;
  roomSubtotal: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  serviceCharge: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
};

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rooms: RoomsService,
    private readonly lock: LockService,
    private readonly payments: PaymentsService,
  ) {}

  private async validateAndPrice(dto: CreateBookingDto): Promise<PricedBooking> {
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

    const nights = Math.round(
      (checkOut.getTime() - checkIn.getTime()) / MS_PER_DAY,
    );

    const roomSubtotal = roomType.basePrice.mul(nights).toDecimalPlaces(2);
    const taxAmount = roomSubtotal.mul(TAX_RATE).toDecimalPlaces(2);
    const serviceCharge = roomSubtotal.mul(SERVICE_RATE).toDecimalPlaces(2);
    const totalAmount = roomSubtotal
      .add(taxAmount)
      .add(serviceCharge)
      .toDecimalPlaces(2);

    return {
      roomType,
      checkIn,
      checkOut,
      nights,
      adults,
      children,
      roomSubtotal,
      taxAmount,
      serviceCharge,
      totalAmount,
    };
  }

  private guestData(dto: CreateBookingDto) {
    return {
      guestFirstName: dto.guestFirstName,
      guestLastName: dto.guestLastName,
      guestEmail: dto.guestEmail.trim().toLowerCase(),
      guestPhone: dto.guestPhone,
      guestCountry: dto.guestCountry ?? "TH",
      specialRequest: dto.specialRequest,
      estimatedArrival: dto.estimatedArrival,
    };
  }

  private async reserveInLock(
    roomTypeId: string,
    checkIn: Date,
    checkOut: Date,
    data: Prisma.BookingUncheckedCreateInput,
  ) {
    return this.lock.withLock(`roomtype:${roomTypeId}`, async () => {
      const available = await this.rooms.availableRoomCount(
        roomTypeId,
        checkIn,
        checkOut,
      );
      if (available <= 0) {
        throw new ConflictException(
          "No rooms available for the selected dates",
        );
      }
      return this.prisma.booking.create({ data });
    });
  }

  async create(dto: CreateBookingDto, booker: AuthUser) {
    const p = await this.validateAndPrice(dto);
    const expiresAt = new Date(Date.now() + PENDING_HOLD_MINUTES * 60 * 1000);

    return this.reserveInLock(p.roomType.id, p.checkIn, p.checkOut, {
      confirmationNumber: this.generateConfirmationNumber(),
      channel: "online",
      roomTypeId: p.roomType.id,
      bookerId: booker.id,
      checkIn: p.checkIn,
      checkOut: p.checkOut,
      nights: p.nights,
      adults: p.adults,
      children: p.children,
      ...this.guestData(dto),
      roomSubtotal: p.roomSubtotal,
      taxAmount: p.taxAmount,
      serviceCharge: p.serviceCharge,
      totalAmount: p.totalAmount,
      status: "pending",
      expiresAt,
    });
  }

  async createWalkIn(dto: CreateBookingDto, staff: AuthUser) {
    const p = await this.validateAndPrice(dto);

    const booking = await this.reserveInLock(
      p.roomType.id,
      p.checkIn,
      p.checkOut,
      {
        confirmationNumber: this.generateConfirmationNumber(),
        channel: "walk_in",
        roomTypeId: p.roomType.id,
        bookerId: staff.id,
        checkIn: p.checkIn,
        checkOut: p.checkOut,
        nights: p.nights,
        adults: p.adults,
        children: p.children,
        ...this.guestData(dto),
        roomSubtotal: p.roomSubtotal,
        taxAmount: p.taxAmount,
        serviceCharge: p.serviceCharge,
        totalAmount: p.totalAmount,
        status: "confirmed",
      },
    );

    await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        method: "cash",
        status: "paid",
        amount: p.totalAmount,
        amountPaid: p.totalAmount,
        paidAt: new Date(),
      },
    });

    return booking;
  }

  async findMine(user: AuthUser) {
    return this.prisma.booking.findMany({
      where: { bookerId: user.id },
      orderBy: { createdAt: "desc" },
      include: { roomType: { select: { name: true, slug: true } } },
    });
  }

  async findAll(filters: { status?: BookingStatus }) {
    return this.prisma.booking.findMany({
      where: { status: filters.status },
      orderBy: [{ checkIn: "asc" }, { createdAt: "desc" }],
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

  async checkIn(id: string, dto: CheckInDto, _user: AuthUser) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException("Booking not found");

    if (booking.status !== "confirmed") {
      throw new ConflictException(
        `Cannot check in a ${booking.status} booking (ต้องเป็น confirmed)`,
      );
    }

    return this.lock.withLock(`roomtype:${booking.roomTypeId}`, async () => {
      let room;
      if (dto.roomId) {
        room = await this.prisma.room.findUnique({ where: { id: dto.roomId } });
        if (!room || room.roomTypeId !== booking.roomTypeId) {
          throw new BadRequestException(
            "Selected room does not match the booking's room type",
          );
        }
        if (room.status !== "available") {
          throw new ConflictException(
            `Room ${room.roomNumber} is not available (status: ${room.status})`,
          );
        }
      } else {
        room = await this.prisma.room.findFirst({
          where: { roomTypeId: booking.roomTypeId, status: "available" },
          orderBy: { roomNumber: "asc" },
        });
        if (!room) {
          throw new ConflictException(
            "No available room to assign for this room type",
          );
        }
      }

      const [, updatedBooking] = await this.prisma.$transaction([
        this.prisma.room.update({
          where: { id: room.id },
          data: { status: "occupied" },
        }),
        this.prisma.booking.update({
          where: { id },
          data: { status: "checked_in", roomId: room.id },
        }),
      ]);
      return updatedBooking;
    });
  }

  async checkOut(id: string, _user: AuthUser) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException("Booking not found");

    if (booking.status !== "checked_in") {
      throw new ConflictException(
        `Cannot check out a ${booking.status} booking (ต้องเป็น checked_in)`,
      );
    }

    const ops: Prisma.PrismaPromise<unknown>[] = [
      this.prisma.booking.update({
        where: { id },
        data: { status: "checked_out" },
      }),
    ];
    if (booking.roomId) {
      ops.push(
        this.prisma.room.update({
          where: { id: booking.roomId },
          data: { status: "cleaning" },
        }),
      );
    }
    const [updatedBooking] = await this.prisma.$transaction(ops);
    return updatedBooking;
  }

  private generateConfirmationNumber(): string {
    return `HH-${randomBytes(4).toString("hex").toUpperCase()}`;
  }
}
