"use client";

import { useState } from "react";
import { BookingStatusBadge } from "@/components/booking-status";
import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/lib/utils";
import { useBooking } from "@/lib/hooks/use-bookings";
import { useCheckIn, useCheckOut, useRooms } from "@/lib/hooks/use-staff";

export function BookingManager({ bookingId }: { bookingId: string }) {
  const { data: b, isLoading, isError } = useBooking(bookingId);
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const availableRooms = useRooms(
    { status: "available", roomTypeId: b?.roomTypeId },
    { enabled: b?.status === "confirmed" },
  );
  const [roomId, setRoomId] = useState("");
  const [err, setErr] = useState<string | null>(null);

  if (isLoading)
    return <div className="rounded-2xl border border-border bg-surface p-6 text-dim">Loading booking…</div>;
  if (isError || !b)
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-danger">
        Booking not found (or no access).
      </div>
    );

  const doCheckIn = async () => {
    setErr(null);
    try {
      await checkIn.mutateAsync({ id: b.id, roomId: roomId.trim() || undefined });
    } catch (e) {
      setErr(apiErrorMessage(e, "Check-in failed"));
    }
  };
  const doCheckOut = async () => {
    setErr(null);
    try {
      await checkOut.mutateAsync(b.id);
    } catch (e) {
      setErr(apiErrorMessage(e, "Check-out failed"));
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-dim">
            {b.confirmationNumber} · {b.channel}
          </p>
          <h3 className="font-display text-lg font-semibold">
            {b.roomType?.name ?? "Room"} ·{" "}
            {b.guestFirstName} {b.guestLastName}
          </h3>
        </div>
        <BookingStatusBadge status={b.status} />
      </div>

      <div className="text-sm text-muted">
        {b.checkIn.slice(0, 10)} → {b.checkOut.slice(0, 10)} · {b.nights} night
        {b.nights > 1 ? "s" : ""}
        {b.roomId && (
          <span className="ml-2 text-brand-light">(room assigned)</span>
        )}
      </div>

      {err && <p className="text-sm text-danger">{err}</p>}

      {b.status === "confirmed" && (
        <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-faint">
              Assign room
            </label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full rounded-lg border border-border-2 bg-surface px-3.5 py-3 text-sm text-fg outline-none focus:border-brand"
            >
              <option value="">Auto-assign (first available)</option>
              {availableRooms.data?.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.roomNumber} · Floor {r.floor}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={doCheckIn} disabled={checkIn.isPending}>
            {checkIn.isPending ? "Checking in…" : "Check in"}
          </Button>
        </div>
      )}

      {b.status === "checked_in" && (
        <div className="border-t border-border pt-4">
          <Button
            variant="secondary"
            onClick={doCheckOut}
            disabled={checkOut.isPending}
          >
            {checkOut.isPending ? "Checking out…" : "Check out"}
          </Button>
        </div>
      )}

      {b.status === "pending" && (
        <p className="border-t border-border pt-4 text-sm text-dim">
          Awaiting payment — can&apos;t check in until confirmed.
        </p>
      )}
      {(b.status === "checked_out" || b.status === "cancelled") && (
        <p className="border-t border-border pt-4 text-sm text-dim">
          No further action for a {b.status} booking.
        </p>
      )}
    </div>
  );
}
