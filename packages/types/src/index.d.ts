export declare const Role: {
    readonly USER: "user";
    readonly ADMIN: "admin";
};
export type Role = (typeof Role)[keyof typeof Role];
export declare const RoomType: {
    readonly SINGLE: "Single";
    readonly DOUBLE: "Double";
    readonly TWIN: "Twin";
};
export type RoomType = (typeof RoomType)[keyof typeof RoomType];
export declare const RoomStatus: {
    readonly AVAILABLE: "Available";
    readonly OCCUPIED: "Occupied";
    readonly RESERVED: "Reserved";
    readonly CLEANING: "Cleaning";
    readonly MAINTENANCE: "Maintenance";
};
export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus];
export declare const BookingStatus: {
    readonly PENDING: "pending";
    readonly CONFIRMED: "confirmed";
    readonly CHECKED_IN: "checked_in";
    readonly CHECKED_OUT: "checked_out";
    readonly CANCELLED: "cancelled";
};
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];
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
