"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AxiosError } from "axios";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/booking-status";
import { PaymentForm } from "@/components/payment-form";
import { formatTHB } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import {
  useBooking,
  useCancelBooking,
  useCreatePaymentIntent,
  type BookingWithRoomType,
} from "@/lib/hooks/use-bookings";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-dim">{label}</span>
      <span className="text-fg">{value}</span>
    </div>
  );
}

function errMsg(e: unknown, fallback: string) {
  const m = (e as AxiosError<{ message?: string }>)?.response?.data?.message;
  return Array.isArray(m) ? m[0] : (m ?? fallback);
}

function PaymentSection({
  booking,
  onPaid,
}: {
  booking: BookingWithRoomType;
  onPaid: () => void;
}) {
  const createPI = useCreatePaymentIntent();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const startPay = async () => {
    setErr(null);
    try {
      const r = await createPI.mutateAsync(booking.id);
      setClientSecret(r.clientSecret);
    } catch (e) {
      setErr(errMsg(e, "Couldn't start payment"));
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-brand/40 bg-brand/5 p-6">
      <p className="mb-3 text-sm text-muted">
        This booking is <span className="text-fg">held</span> pending payment
        {booking.expiresAt
          ? ` until ${new Date(booking.expiresAt).toLocaleString()}`
          : ""}
        .
      </p>
      {err && <p className="mb-3 text-sm text-danger">{err}</p>}
      {!clientSecret ? (
        <Button
          className="w-full"
          onClick={startPay}
          disabled={createPI.isPending}
        >
          {createPI.isPending ? "Starting…" : `Pay ${formatTHB(booking.totalAmount)}`}
        </Button>
      ) : (
        <PaymentForm clientSecret={clientSecret} onPaid={onPaid} />
      )}
    </div>
  );
}

function CancelBlock({ id }: { id: string }) {
  const cancel = useCancelBooking();
  const [confirm, setConfirm] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const doCancel = async () => {
    setErr(null);
    try {
      await cancel.mutateAsync(id);
    } catch (e) {
      setErr(errMsg(e, "Could not cancel"));
      setConfirm(false);
    }
  };

  return (
    <div className="mt-6">
      {err && <p className="mb-2 text-sm text-danger">{err}</p>}
      {!confirm ? (
        <Button variant="ghost" onClick={() => setConfirm(true)}>
          Cancel booking
        </Button>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">Cancel this booking?</span>
          <Button
            variant="danger"
            size="sm"
            onClick={doCancel}
            disabled={cancel.isPending}
          >
            {cancel.isPending ? "Cancelling…" : "Yes, cancel"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>
            Keep it
          </Button>
        </div>
      )}
    </div>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, authLoading } = useAuth();
  const { data: b, isLoading, isError, refetch } = useBooking(id);
  const [justPaid, setJustPaid] = useState(false);

  useEffect(() => {
    if (!justPaid || b?.status === "confirmed") return;
    const iv = setInterval(() => refetch(), 2000);
    const stop = setTimeout(() => clearInterval(iv), 20000);
    return () => {
      clearInterval(iv);
      clearTimeout(stop);
    };
  }, [justPaid, b?.status, refetch]);

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-2xl px-6 py-12">
        {!authLoading && !user && (
          <div>
            <p className="text-muted">Please sign in to view this booking.</p>
            <Link
              href={`/login?next=/bookings/${id}`}
              className="mt-3 inline-block text-brand"
            >
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
              <BookingStatusBadge status={b.status} />
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

            {b.status === "pending" &&
              (justPaid ? (
                <div className="mt-6 rounded-2xl border border-brand/40 bg-brand/5 p-6 text-sm text-muted">
                  Confirming your payment… (waiting for Stripe)
                </div>
              ) : (
                <PaymentSection booking={b} onPaid={() => setJustPaid(true)} />
              ))}

            {b.status === "confirmed" && (
              <div className="mt-6 rounded-2xl border border-success/40 bg-success/5 p-6 text-sm text-fg">
                ✓ Payment received — your stay is confirmed. See you soon!
              </div>
            )}

            {(b.status === "pending" || b.status === "confirmed") && (
              <CancelBlock id={b.id} />
            )}

            <Link href="/bookings" className="mt-6 inline-block text-sm text-brand">
              ← All my bookings
            </Link>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
