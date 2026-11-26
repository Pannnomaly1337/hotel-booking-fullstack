"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { formatTHB } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useBooking } from "@/lib/hooks/use-bookings";
import type { BookingStatus } from "@repo/types";

const statusTone: Record<BookingStatus, BadgeProps["tone"]> = {
  pending: "brand",
  confirmed: "success",
  checked_in: "success",
  checked_out: "muted",
  cancelled: "danger",
  no_show: "danger",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-dim">{label}</span>
      <span className="text-fg">{value}</span>
    </div>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, authLoading } = useAuth();
  const { data: b, isLoading, isError } = useBooking(id);

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-2xl px-6 py-12">
        {!authLoading && !user && (
          <div>
            <p className="text-muted">Please sign in to view this booking.</p>
            <Link href="/login" className="mt-3 inline-block text-brand">
              Sign in →
            </Link>
          </div>
        )}

        {user && isLoading && <p className="text-dim">Loading booking…</p>}

        {user && isError && (
          <p className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
            Couldn&apos;t load this booking (not found or not yours).
          </p>
        )}

        {user && b && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-dim">Booking confirmation</p>
                <h1 className="font-display text-2xl font-semibold">
                  {b.confirmationNumber}
                </h1>
              </div>
              <Badge tone={statusTone[b.status]}>{b.status}</Badge>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="font-display text-lg font-semibold">
                {b.roomType?.name ?? "Room"}
              </h2>
              <div className="mt-3 border-b border-border pb-3">
                <Row label="Check-in" value={b.checkIn.slice(0, 10)} />
                <Row label="Check-out" value={b.checkOut.slice(0, 10)} />
                <Row label="Nights" value={String(b.nights)} />
                <Row
                  label="Guests"
                  value={`${b.adults} adult${b.adults > 1 ? "s" : ""}${
                    b.children ? `, ${b.children} children` : ""
                  }`}
                />
              </div>

              <div className="pt-3">
                <Row label="Room subtotal" value={formatTHB(b.roomSubtotal)} />
                <Row label="Tax (7%)" value={formatTHB(b.taxAmount)} />
                <Row label="Service (10%)" value={formatTHB(b.serviceCharge)} />
                <div className="mt-2 flex justify-between border-t border-border pt-3">
                  <span className="font-semibold">Total</span>
                  <span className="font-display text-xl font-semibold text-brand-light">
                    {formatTHB(b.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {b.status === "pending" && (
              <div className="mt-6 rounded-2xl border border-brand/40 bg-brand/5 p-6">
                <p className="mb-3 text-sm text-muted">
                  This booking is <span className="text-fg">held</span> pending
                  payment
                  {b.expiresAt
                    ? ` until ${new Date(b.expiresAt).toLocaleString()}`
                    : ""}
                  .
                </p>
                <Button className="w-full" disabled>
                  Pay now (coming in W3)
                </Button>
              </div>
            )}

            <Link
              href="/rooms"
              className="mt-6 inline-block text-sm text-brand"
            >
              ← Browse more rooms
            </Link>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
