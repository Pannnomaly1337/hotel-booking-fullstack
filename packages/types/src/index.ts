/**
 * Shared contract between the web (Next.js) and api (NestJS) apps.
 * These enums MUST stay in sync with prisma/schema.prisma.
 */

export const Role = {
  USER: "user",
  ADMIN: "admin",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const RoomType = {
  SINGLE: "Single",
  DOUBLE: "Double",
  TWIN: "Twin",
} as const;
export type RoomType = (typeof RoomType)[keyof typeof RoomType];

export const RoomStatus = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  RESERVED: "Reserved",
  CLEANING: "Cleaning",
  MAINTENANCE: "Maintenance",
} as const;
export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus];

export const BookingStatus = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CHECKED_IN: "checked_in",
  CHECKED_OUT: "checked_out",
  CANCELLED: "cancelled",
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

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

export interface PublicUser {
  id: string;
  firstname: string;
  lastname: string;
  imagelink: string;
  detail: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  roomNumber: number;
  type: RoomType;
  status: RoomStatus;
  floor: number;
  roomRate: number;
  imagelink: string | null;
  currentGuestId: string | null;
  notes: string | null;
  size: string | null;
  additional1: string | null;
  additional2: string | null;
  additional3: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  roomId: string;
  confirmationNumber: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  specialRequest: string | null;
  roomRate: number;
  totalAmount: number;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}
