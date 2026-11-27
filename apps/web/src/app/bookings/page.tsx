"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { BookingStatusBadge } from "@/components/booking-status";
import { formatTHB } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useMyBookings } from "@/lib/hooks/use-bookings";

export default function MyBookingsPage() {
  const { user, authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  const { data, isLoading } = useMyBookings();

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="mb-7 font-display text-3xl font-semibold">My bookings</h1>

        {(authLoading || !user || isLoading) && (
          <p className="text-dim">Loading…</p>
        )}

        {user && data && data.length === 0 && (
          <p className="text-dim">
            No bookings yet.{" "}
            <Link href="/rooms" className="text-brand">
              Browse rooms →
            </Link>
          </p>
        )}

        <div className="space-y-4">
          {user &&
            data?.map((b) => (
              <Link
                key={b.id}
                href={`/bookings/${b.id}`}
                className="block rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-brand/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg font-semibold">
                        {b.roomType?.name ?? "Room"}
                      </span>
                      <BookingStatusBadge status={b.status} />
                    </div>
                    <p className="mt-1 text-sm text-dim">
                      {b.checkIn.slice(0, 10)} → {b.checkOut.slice(0, 10)} ·{" "}
                      {b.nights} night{b.nights > 1 ? "s" : ""} ·{" "}
                      {b.confirmationNumber}
                    </p>
                  </div>
                  <span className="font-display text-lg font-semibold text-brand-light">
                    {formatTHB(b.totalAmount)}
                  </span>
                </div>
              </Link>
            ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
