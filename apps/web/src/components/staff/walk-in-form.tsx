"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Booking } from "@repo/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorMessage } from "@/lib/utils";
import { useRoomSearch } from "@/lib/hooks/use-rooms";
import { useCreateWalkIn } from "@/lib/hooks/use-staff";

const schema = z
  .object({
    roomTypeId: z.string().min(1, "Select a room"),
    checkIn: z.string().min(1, "Required"),
    checkOut: z.string().min(1, "Required"),
    adults: z.coerce.number().min(1),
    children: z.coerce.number().min(0),
    guestFirstName: z.string().min(1, "Required"),
    guestLastName: z.string().min(1, "Required"),
    guestEmail: z.string().email("Invalid email"),
    guestPhone: z.string().min(1, "Required"),
  })
  .refine((d) => d.checkOut > d.checkIn, {
    message: "Check-out must be after check-in",
    path: ["checkOut"],
  });
type FormValues = z.infer<typeof schema>;

export function WalkInForm({ onCreated }: { onCreated: (b: Booking) => void }) {
  const { data: roomTypes } = useRoomSearch({});
  const createWalkIn = useCreateWalkIn();
  const [err, setErr] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { adults: 1, children: 0 },
  });

  const onSubmit = async (v: FormValues) => {
    setErr(null);
    try {
      const booking = await createWalkIn.mutateAsync(v);
      reset();
      onCreated(booking);
    } catch (e) {
      setErr(apiErrorMessage(e, "Couldn't create walk-in booking"));
    }
  };

  const fieldCls =
    "rounded-lg border border-border-2 bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-brand";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-2xl border border-border bg-surface p-6"
    >
      <h2 className="font-display text-lg font-semibold">New walk-in booking</h2>
      {err && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {err}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="roomTypeId">Room type</Label>
        <select id="roomTypeId" className={`${fieldCls} w-full`} {...register("roomTypeId")}>
          <option value="">Select a room…</option>
          {roomTypes?.map((rt) => (
            <option key={rt.id} value={rt.id}>
              {rt.name} — ฿{Number(rt.basePrice).toLocaleString()}/night
            </option>
          ))}
        </select>
        {errors.roomTypeId && (
          <p className="text-xs text-danger">{errors.roomTypeId.message}</p>
        )}
      </div>

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
        <Label>Guest name</Label>
        <div className="flex gap-3">
          <Input placeholder="First" {...register("guestFirstName")} />
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

      <Button type="submit" className="w-full" disabled={createWalkIn.isPending}>
        {createWalkIn.isPending ? "Creating…" : "Create walk-in (paid at desk)"}
      </Button>
    </form>
  );
}
