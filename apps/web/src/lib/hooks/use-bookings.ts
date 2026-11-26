import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiResponse, Booking } from "@repo/types";
import { api } from "@/lib/api";

export interface CreateBookingInput {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  guestCountry?: string;
  specialRequest?: string;
}

export type BookingWithRoomType = Booking & {
  roomType?: { name: string; slug: string };
};

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const { data } = await api.post<ApiResponse<Booking>>("/bookings", input);
      return data.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<BookingWithRoomType>>(
        `/bookings/${id}`,
      );
      return data.data!;
    },
    enabled: Boolean(id),
    retry: false,
  });
}
