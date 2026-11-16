"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Room } from "@repo/types";
import { api } from "@/lib/api";

// Example page proving the end-to-end wiring: fetches rooms from the
// NestJS API (public endpoint) and renders them.
export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/rooms")
      .then(({ data }) => setRooms(data.data ?? []))
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Hotel Booking</h1>
        <Link
          href="/login"
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Login
        </Link>
      </header>

      <h2 className="mb-4 text-xl font-semibold">Available rooms</h2>

      {loading ? (
        <p className="text-neutral-500">Loading rooms…</p>
      ) : rooms.length === 0 ? (
        <p className="text-neutral-500">
          No rooms yet — is the API running and seeded?
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <li
              key={room.id}
              className="rounded-xl border border-neutral-200 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">
                  #{room.roomNumber}
                </span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">
                  {room.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-600">
                {room.type} · Floor {room.floor}
              </p>
              <p className="mt-2 text-sm font-medium">
                ฿{room.roomRate.toLocaleString()} / night
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
