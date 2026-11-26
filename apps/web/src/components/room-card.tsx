import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatTHB } from "@/lib/utils";
import type { RoomTypeWithAvailability } from "@/lib/hooks/use-rooms";

export function RoomCard({
  room,
  query,
}: {
  room: RoomTypeWithAvailability;
  query?: string;
}) {
  const href = `/rooms/${room.slug}${query ? `?${query}` : ""}`;
  const showAvail = typeof room.availableRooms === "number";
  const soldOut = showAvail && room.availableRooms! <= 0;

  return (
    <Link
      href={href}
      className="block overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-brand/60"
    >
      <div className="h-52 bg-[#241a3a]" />
      <div className="p-6">
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <h3 className="font-display text-lg font-semibold">{room.name}</h3>
          {showAvail &&
            (soldOut ? (
              <Badge tone="muted">Full</Badge>
            ) : (
              <Badge tone="success">{room.availableRooms} left</Badge>
            ))}
        </div>
        <p className="mb-4 text-sm text-dim">
          {room.bedType} · {room.sizeSqm} sqm · up to {room.maxAdults} guests
        </p>
        <div>
          <span className="font-display text-xl font-semibold text-brand-light">
            {formatTHB(room.basePrice)}
          </span>
          <span className="text-sm text-faint"> / night</span>
        </div>
      </div>
    </Link>
  );
}
