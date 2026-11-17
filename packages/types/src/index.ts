/**
 * Shared contract between the web (Next.js) and api (NestJS) apps.
 * These enums MUST stay in sync with prisma/schema.prisma (HotelHub).
 *
 * หมายเหตุ: field ที่เป็น Decimal ใน Prisma (เงิน) จะถูก serialize เป็น "string"
 * เวลาส่งผ่าน JSON → ใน contract นี้จึงเป็น string (เลี่ยง float ฝั่ง client, ตาม ADR-003)
 */

// ───────────── Enums (ตรงกับ schema.prisma) ─────────────

export const Role = {
  CUSTOMER: "customer",
  FRONTDESK: "frontdesk",
  HOUSEKEEPING: "housekeeping",
  MANAGER: "manager",
  ADMIN: "admin",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const RoomStatus = {
  AVAILABLE: "available",
  OCCUPIED: "occupied",
  RESERVED: "reserved",
  CLEANING: "cleaning",
  MAINTENANCE: "maintenance",
} as const;
export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus];

export const BookingStatus = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CHECKED_IN: "checked_in",
  CHECKED_OUT: "checked_out",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const BookingChannel = {
  ONLINE: "online",
  WALK_IN: "walk_in",
  PHONE: "phone",
} as const;
export type BookingChannel = (typeof BookingChannel)[keyof typeof BookingChannel];

export const PaymentMethod = {
  CARD: "card",
  PROMPTPAY: "promptpay",
  CASH: "cash",
  BANK_TRANSFER: "bank_transfer",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: "pending",
  PARTIALLY_PAID: "partially_paid",
  PAID: "paid",
  REFUNDED: "refunded",
  FAILED: "failed",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

// ───────────── API envelope ─────────────

/** Standard API envelope returned by every endpoint. */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: Pagination;
}

export interface Pagination {
  totalItems: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

// ───────────── Entities (รูปแบบที่ api ส่งให้ client) ─────────────

/** User ที่ปลอดภัยพอจะส่งให้ client — ไม่มี passwordHash */
export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoomType {
  id: string;
  slug: string;
  name: string;
  description: string;
  basePrice: string; // Decimal → string
  maxAdults: number;
  maxChildren: number;
  bedType: string;
  sizeSqm: number;
  images: string[];
  amenities: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  roomNumber: number;
  floor: number;
  status: RoomStatus;
  roomTypeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  confirmationNumber: string;
  channel: BookingChannel;
  roomTypeId: string;
  roomId: string | null;
  bookerId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  guestCountry: string;
  specialRequest: string | null;
  estimatedArrival: string | null;
  currency: string;
  roomSubtotal: string; // Decimal → string
  taxAmount: string;
  serviceCharge: string;
  discountAmount: string;
  totalAmount: string;
  refundableUntil: string | null;
  expiresAt: string | null;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: string; // Decimal → string
  amountPaid: string;
  currency: string;
  provider: string | null;
  providerIntentId: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}
