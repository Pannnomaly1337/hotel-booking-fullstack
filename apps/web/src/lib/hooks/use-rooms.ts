import { useQuery } from "@tanstack/react-query";
import type { ApiResponse, RoomType } from "@repo/types";
import { api } from "@/lib/api";

export type RoomTypeWithAvailability = RoomType & { availableRooms?: number };

export interface RoomSearchParams {
  checkIn?: string;
  checkOut?: string;
  adults?: string;
  children?: string;
}

export function useRoomSearch(p: RoomSearchParams) {
  const hasDates = Boolean(p.checkIn && p.checkOut);
  return useQuery({
    queryKey: ["rooms", p],
    queryFn: async () => {
      if (hasDates) {
        const params = new URLSearchParams();
        params.set("checkIn", p.checkIn!);
        params.set("checkOut", p.checkOut!);
        if (p.adults) params.set("adults", p.adults);
        if (p.children) params.set("children", p.children);
        const { data } = await api.get<ApiResponse<RoomTypeWithAvailability[]>>(
          `/room-types/search?${params.toString()}`,
        );
        return data.data ?? [];
      }
      const { data } =
        await api.get<ApiResponse<RoomTypeWithAvailability[]>>("/room-types");
      return data.data ?? [];
    },
  });
}

export function useRoomType(slug: string) {
  return useQuery({
    queryKey: ["room", slug],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<RoomType>>(
        `/room-types/${slug}`,
      );
      return data.data!;
    },
    enabled: Boolean(slug),
  });
}
