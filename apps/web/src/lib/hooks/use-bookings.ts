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

export function useMyBookings() {
  return useQuery({
    queryKey: ["my-bookings"],
    queryFn: async () => {
      const { data } =
        await api.get<ApiResponse<BookingWithRoomType[]>>("/bookings");
      return data.data ?? [];
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<ApiResponse<Booking>>(
        `/bookings/${id}/cancel`,
        {},
      );
      return data.data!;
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      qc.invalidateQueries({ queryKey: ["booking", id] });
      qc.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export interface PaymentIntentResult {
  clientSecret: string;
  amount: number;
  currency: string;
  paymentIntentId: string;
}

export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data } = await api.post<ApiResponse<PaymentIntentResult>>(
        "/payments/create-intent",
        { bookingId },
      );
      return data.data!;
    },
  });
}
