"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SearchCard() {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    params.set("adults", guests);
    router.push(`/rooms?${params.toString()}`);
  };

  const fieldLabel =
    "text-xs font-semibold uppercase tracking-wide text-faint";
  const fieldInput =
    "rounded-lg border border-border-2 bg-inset px-3.5 py-3 text-sm text-fg outline-none focus:border-brand";

  return (
    <form
      onSubmit={onSubmit}
      className="relative mx-auto -mt-12 flex max-w-5xl flex-wrap items-end gap-3 rounded-2xl border border-border-2 bg-elevated p-5 shadow-2xl shadow-black/50"
    >
      <label className="flex min-w-0 flex-[1_1_170px] flex-col gap-1.5">
        <span className={fieldLabel}>Check-in</span>
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className={fieldInput}
        />
      </label>
      <label className="flex min-w-0 flex-[1_1_170px] flex-col gap-1.5">
        <span className={fieldLabel}>Check-out</span>
        <input
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className={fieldInput}
        />
      </label>
      <label className="flex min-w-0 flex-[1_1_150px] flex-col gap-1.5">
        <span className={fieldLabel}>Guests</span>
        <select
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          className={fieldInput}
        >
          <option value="1">1 guest</option>
          <option value="2">2 guests</option>
          <option value="3">3 guests</option>
          <option value="4">4 guests</option>
        </select>
      </label>
      <Button type="submit" size="lg" className="flex-[1_1_150px]">
        Search rooms
      </Button>
    </form>
  );
}
