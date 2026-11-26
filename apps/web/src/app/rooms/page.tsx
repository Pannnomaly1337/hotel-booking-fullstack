"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { RoomCard } from "@/components/room-card";
import { Button } from "@/components/ui/button";
import { useRoomSearch } from "@/lib/hooks/use-rooms";

function RoomsContent() {
  const sp = useSearchParams();
  const router = useRouter();

  const checkIn = sp.get("checkIn") ?? "";
  const checkOut = sp.get("checkOut") ?? "";
  const adults = sp.get("adults") ?? "2";
  const children = sp.get("children") ?? "";

  const { data: rooms, isLoading, isError } = useRoomSearch({
    checkIn,
    checkOut,
    adults,
    children,
  });

  const [f, setF] = useState({ checkIn, checkOut, adults });
  const applyFilter = (e: FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (f.checkIn) p.set("checkIn", f.checkIn);
    if (f.checkOut) p.set("checkOut", f.checkOut);
    p.set("adults", f.adults);
    router.push(`/rooms?${p.toString()}`);
  };

  const carry = (() => {
    const p = new URLSearchParams();
    if (checkIn) p.set("checkIn", checkIn);
    if (checkOut) p.set("checkOut", checkOut);
    if (adults) p.set("adults", adults);
    return p.toString();
  })();

  const field =
    "rounded-lg border border-border-2 bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-brand";

  return (
    <main className="px-6 py-10 md:px-18">
      <h1 className="mb-1 font-display text-3xl font-semibold">Our rooms</h1>
      <p className="mb-7 text-sm text-dim">
        {checkIn && checkOut
          ? `Availability for ${checkIn} → ${checkOut}`
          : "Browse all room types"}
      </p>

      <form
        onSubmit={applyFilter}
        className="mb-9 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-4"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-faint">
            Check-in
          </span>
          <input
            type="date"
            value={f.checkIn}
            onChange={(e) => setF({ ...f, checkIn: e.target.value })}
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-faint">
            Check-out
          </span>
          <input
            type="date"
            value={f.checkOut}
            onChange={(e) => setF({ ...f, checkOut: e.target.value })}
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-faint">
            Guests
          </span>
          <select
            value={f.adults}
            onChange={(e) => setF({ ...f, adults: e.target.value })}
            className={field}
          >
            <option value="1">1 guest</option>
            <option value="2">2 guests</option>
            <option value="3">3 guests</option>
            <option value="4">4 guests</option>
          </select>
        </label>
        <Button type="submit" size="md">
          Check availability
        </Button>
      </form>

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-2xl border border-border bg-surface"
            />
          ))}
        </div>
      )}

      {isError && (
        <p className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          Couldn&apos;t load rooms. Make sure the API is running, then try
          again.
        </p>
      )}

      {rooms && rooms.length === 0 && (
        <p className="text-dim">No room types match these dates.</p>
      )}

      {rooms && rooms.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} query={carry} />
          ))}
        </div>
      )}
    </main>
  );
}

export default function RoomsPage() {
  return (
    <>
      <SiteNav />
      <Suspense fallback={<div className="p-16 text-dim">Loading…</div>}>
        <RoomsContent />
      </Suspense>
      <SiteFooter />
    </>
  );
}
