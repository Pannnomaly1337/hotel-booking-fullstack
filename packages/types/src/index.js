"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingStatus = exports.RoomStatus = exports.RoomType = exports.Role = void 0;
exports.Role = {
    USER: "user",
    ADMIN: "admin",
};
exports.RoomType = {
    SINGLE: "Single",
    DOUBLE: "Double",
    TWIN: "Twin",
};
exports.RoomStatus = {
    AVAILABLE: "Available",
    OCCUPIED: "Occupied",
    RESERVED: "Reserved",
    CLEANING: "Cleaning",
    MAINTENANCE: "Maintenance",
};
exports.BookingStatus = {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    CHECKED_IN: "checked_in",
    CHECKED_OUT: "checked_out",
    CANCELLED: "cancelled",
};
//# sourceMappingURL=index.js.map