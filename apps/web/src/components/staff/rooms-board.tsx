"use client";

import { useState } from "react";
import type { RoomStatus } from "@repo/types";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, apiErrorMessage } from "@/lib/utils";
import { useRooms, useUpdateRoomStatus } from "@/lib/hooks/use-staff";

const roomTone: Record<RoomStatus, BadgeProps["tone"]> = {
  available: "success",
  cleaning: "brand",
  occupied: "muted",
  reserved: "muted",
  maintenance: "danger",
};

const nextActions: Record<RoomStatus, { label: string; to: RoomStatus }[]> = {
  cleaning: [
    { label: "Mark available", to: "available" },
    { label: "Needs maintenance", to: "maintenance" },
  ],
  maintenance: [{ label: "Mark available", to: "available" }],
  available: [{ label: "Take for maintenance", to: "maintenance" }],
  occupied: [],
  reserved: [],
};

const filters: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Cleaning", value: "cleaning" },
  { label: "Available", value: "available" },
  { label: "Occupied", value: "occupied" },
  { label: "Maintenance", value: "maintenance" },
];

export function RoomsBoard() {
  const [status, setStatus] = useState("");
  const { data: rooms, isLoading } = useRooms({ status });
  const update = useUpdateRoomStatus();
  const [err, setErr] = useState<string | null>(null);

  const change = async (id: string, to: RoomStatus) => {
    setErr(null);
    try {
      await update.mutateAsync({ id, status: to });
    } catch (e) {
      setErr(apiErrorMessage(e, "Couldn't update room"));
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value || "all"}
            onClick={() => setStatus(f.value)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              status === f.value
                ? "border-brand bg-brand/15 text-brand-light"
                : "border-border text-dim hover:text-fg",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {err && (
        <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {err}
        </p>
      )}
      {isLoading && <p className="text-dim">Loading rooms…</p>}
      {rooms && rooms.length === 0 && (
        <p className="text-dim">No rooms in this view.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms?.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-display text-lg font-semibold">
                  Room {r.roomNumber}
                </span>
                <p className="text-xs text-dim">
                  Floor {r.floor} · {r.roomType?.name ?? ""}
                </p>
              </div>
              <Badge tone={roomTone[r.status]}>{r.status}</Badge>
            </div>

            {nextActions[r.status].length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {nextActions[r.status].map((a) => (
                  <Button
                    key={a.to}
                    size="sm"
                    variant={a.to === "available" ? "primary" : "ghost"}
                    onClick={() => change(r.id, a.to)}
                    disabled={update.isPending}
                  >
                    {a.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
