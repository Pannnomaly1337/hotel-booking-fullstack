"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { Check } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatTHB } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useRoomType, type RoomTypeWithAvailability } from "@/lib/hooks/use-rooms";
import { useCreateBooking } from "@/lib/hooks/use-bookings";
import type { PublicUser } from "@repo/types";

const schema = z
  .object({
    checkIn: z.string().min(1, "Required"),
    checkOut: z.string().min(1, "Required"),
    adults: z.coerce.number().min(1),
    children: z.coerce.number().min(0),
    guestFirstName: z.string().min(1, "Required"),
    guestLastName: z.string().min(1, "Required"),
    guestEmail: z.string().email("Invalid email"),
    guestPhone: z.string().min(1, "Required"),
    specialRequest: z.string().optional(),
  })
  .refine((d) => d.checkOut > d.checkIn, {
    message: "Check-out must be after check-in",
    path: ["checkOut"],
  });
type FormValues = z.infer<typeof schema>;

function BookingPanel({
  room,
  user,
  prefill,
}: {
  room: RoomTypeWithAvailability;
  user: PublicUser;
  prefill: { checkIn: string; checkOut: string; adults: string };
}) {
  const router = useRouter();
  const createBooking = useCreateBooking();
  const [err, setErr] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      checkIn: prefill.checkIn,
      checkOut: prefill.checkOut,
      adults: Number(prefill.adults) || 1,
      children: 0,
      guestFirstName: user.firstName,
      guestLastName: user.lastName,
      guestEmail: user.email,
      guestPhone: user.phone ?? "",
      specialRequest: "",
    },
  });

  const onSubmit = async (v: FormValues) => {
    setErr(null);
    try {
      const booking = await createBooking.mutateAsync({
        roomTypeId: room.id,
        ...v,
      });
      router.push(`/bookings/${booking.id}`); // ไปหน้าสรุป + จ่าย (W3)
    } catch (e) {
      const msg =
        (e as AxiosError<{ message?: string }>)?.response?.data?.message ??
        "Could not create booking";
      setErr(Array.isArray(msg) ? msg[0] : String(msg));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {err && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {err}
        </p>
      )}
      <div className="flex gap-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="checkIn">Check-in</Label>
          <Input id="checkIn" type="date" {...register("checkIn")} />
          {errors.checkIn && (
            <p className="text-xs text-danger">{errors.checkIn.message}</p>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="checkOut">Check-out</Label>
          <Input id="checkOut" type="date" {...register("checkOut")} />
          {errors.checkOut && (
            <p className="text-xs text-danger">{errors.checkOut.message}</p>
          )}
        </div>
      </div>
      <div className="flex gap-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="adults">Adults</Label>
          <Input id="adults" type="number" min={1} {...register("adults")} />
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="children">Children</Label>
          <Input id="children" type="number" min={0} {...register("children")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="guestFirstName">Guest name</Label>
        <div className="flex gap-3">
          <Input
            id="guestFirstName"
            placeholder="First"
            {...register("guestFirstName")}
          />
          <Input placeholder="Last" {...register("guestLastName")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="guestEmail">Email</Label>
        <Input id="guestEmail" type="email" {...register("guestEmail")} />
        {errors.guestEmail && (
          <p className="text-xs text-danger">{errors.guestEmail.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="guestPhone">Phone</Label>
        <Input id="guestPhone" {...register("guestPhone")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="specialRequest">Special request (optional)</Label>
        <Input id="specialRequest" {...register("specialRequest")} />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={createBooking.isPending}
      >
        {createBooking.isPending ? "Reserving…" : "Reserve"}
      </Button>
      <p className="text-center text-xs text-faint">
        Taxes &amp; total are confirmed on the next step.
      </p>
    </form>
  );
}

function RoomDetailContent() {
  const { slug } = useParams<{ slug: string }>();
  const sp = useSearchParams();
  const { user } = useAuth();
  const { data: room, isLoading, isError } = useRoomType(slug);

  const prefill = {
    checkIn: sp.get("checkIn") ?? "",
    checkOut: sp.get("checkOut") ?? "",
    adults: sp.get("adults") ?? "2",
  };

  // login แล้วเด้งกลับมาหน้าห้องนี้ (พร้อม query วัน/คน) เพื่อจองต่อได้เลย
  const qs = sp.toString();
  const signInHref = `/login?next=${encodeURIComponent(
    `/rooms/${slug}${qs ? `?${qs}` : ""}`,
  )}`;

  if (isLoading)
    return <div className="px-6 py-16 text-dim md:px-18">Loading room…</div>;
  if (isError || !room)
    return (
      <div className="px-6 py-16 md:px-18">
        <p className="text-danger">Room not found.</p>
        <Link href="/rooms" className="mt-3 inline-block text-brand">
          ← Back to rooms
        </Link>
      </div>
    );

  return (
    <main className="grid grid-cols-1 gap-10 px-6 py-10 md:px-18 lg:grid-cols-[1.4fr_1fr]">
      {/* left: room info */}
      <div>
        <div className="mb-6 h-80 rounded-2xl border border-border bg-[#241a3a]" />
        <h1 className="font-display text-3xl font-semibold">{room.name}</h1>
        <p className="mt-1 text-sm text-dim">
          {room.bedType} · {room.sizeSqm} sqm · up to {room.maxAdults} adults /{" "}
          {room.maxChildren} children
        </p>
        <p className="mt-5 leading-relaxed text-muted">{room.description}</p>

        {room.amenities?.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 font-display text-lg font-semibold">Amenities</h2>
            <ul className="grid grid-cols-2 gap-2 text-sm text-muted">
              {room.amenities.map((a) => (
                <li key={a} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-brand-light" /> {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* right: booking panel */}
      <div className="h-fit rounded-2xl border border-border bg-surface p-6 lg:sticky lg:top-6">
        <div className="mb-5">
          <span className="font-display text-2xl font-semibold text-brand-light">
            {formatTHB(room.basePrice)}
          </span>
          <span className="text-sm text-faint"> / night</span>
        </div>

        {user ? (
          <BookingPanel room={room} user={user} prefill={prefill} />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted">Sign in to book this room.</p>
            <Link href={signInHref}>
              <Button className="w-full">Sign in to book</Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default function RoomDetailPage() {
  return (
    <>
      <SiteNav />
      <Suspense fallback={<div className="p-16 text-dim">Loading…</div>}>
        <RoomDetailContent />
      </Suspense>
      <SiteFooter />
    </>
  );
}
