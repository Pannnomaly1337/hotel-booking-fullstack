"use client";

import { useState } from "react";
import { BookingStatusBadge } from "@/components/booking-status";
import { cn } from "@/lib/utils";
import { useAllBookings } from "@/lib/hooks/use-staff";

const filters = [
  { label: "Arriving", value: "confirmed" },
  { label: "In-house", value: "checked_in" },
  { label: "All", value: "" },
];

export function BookingQueue({
  onSelect,
  activeId,
}: {
  onSelect: (id: string | null) => void;
  activeId: string | null;
}) {
  const [status, setStatus] = useState("checked_in");
  const { data, isLoading } = useAllBookings(status);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="mb-3 text-sm font-semibold text-muted">Front desk queue</h3>

      <div className="mb-3 flex gap-2">
        {filters.map((f) => (
          <button
            key={f.value || "all"}
            onClick={() => {
              setStatus(f.value);
              onSelect(null);
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              status === f.value
                ? "border-brand bg-brand/15 text-brand-light"
                : "border-border text-dim hover:text-fg",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-dim">Loading…</p>}
      {data && data.length === 0 && (
        <p className="text-sm text-dim">No bookings in this view.</p>
      )}

      <div className="max-h-96 space-y-2 overflow-auto">
        {data?.map((b) => (
          <button
            key={b.id}
            onClick={() => onSelect(b.id)}
            className={cn(
              "w-full rounded-lg border px-3 py-2 text-left transition-colors",
              activeId === b.id
                ? "border-brand bg-brand/5"
                : "border-border hover:border-brand/50",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">
                {b.roomType?.name ?? "Room"} · {b.guestFirstName}{" "}
                {b.guestLastName}
              </span>
              <BookingStatusBadge status={b.status} />
            </div>
            <p className="text-xs text-dim">
              {b.confirmationNumber} · {b.checkIn.slice(0, 10)} →{" "}
              {b.checkOut.slice(0, 10)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
