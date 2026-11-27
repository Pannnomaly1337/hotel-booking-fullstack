import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiResponse, Booking, Room, RoomStatus } from "@repo/types";
import { api } from "@/lib/api";
import type { CreateBookingInput, BookingWithRoomType } from "./use-bookings";

export type StaffRoom = Room & { roomType?: { name: string; slug: string } };

export function useAllBookings(status: string) {
  return useQuery({
    queryKey: ["all-bookings", status],
    queryFn: async () => {
      const qs = status ? `?status=${status}` : "";
      const { data } = await api.get<ApiResponse<BookingWithRoomType[]>>(
        `/bookings/all${qs}`,
      );
      return data.data ?? [];
    },
  });
}

export function useRooms(
  filters: { status?: string; floor?: string; roomTypeId?: string },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["staff-rooms", filters],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (filters.status) p.set("status", filters.status);
      if (filters.floor) p.set("floor", filters.floor);
      if (filters.roomTypeId) p.set("roomTypeId", filters.roomTypeId);
      const qs = p.toString();
      const { data } = await api.get<ApiResponse<StaffRoom[]>>(
        `/rooms${qs ? `?${qs}` : ""}`,
      );
      return data.data ?? [];
    },
    enabled: options?.enabled ?? true,
  });
}

export function useUpdateRoomStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RoomStatus }) => {
      const { data } = await api.patch<ApiResponse<Room>>(
        `/rooms/${id}/status`,
        { status },
      );
      return data.data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-rooms"] }),
  });
}

export function useCreateWalkIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const { data } = await api.post<ApiResponse<Booking>>(
        "/bookings/walk-in",
        input,
      );
      return data.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-rooms"] });
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.invalidateQueries({ queryKey: ["all-bookings"] });
    },
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, roomId }: { id: string; roomId?: string }) => {
      const { data } = await api.post<ApiResponse<Booking>>(
        `/bookings/${id}/check-in`,
        roomId ? { roomId } : {},
      );
      return data.data!;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["booking", v.id] });
      qc.invalidateQueries({ queryKey: ["staff-rooms"] });
      qc.invalidateQueries({ queryKey: ["all-bookings"] });
    },
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<ApiResponse<Booking>>(
        `/bookings/${id}/check-out`,
        {},
      );
      return data.data!;
    },
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["booking", id] });
      qc.invalidateQueries({ queryKey: ["staff-rooms"] });
      qc.invalidateQueries({ queryKey: ["all-bookings"] });
    },
  });
}
