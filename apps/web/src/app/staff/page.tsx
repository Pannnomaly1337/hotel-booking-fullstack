"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { isStaff } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WalkInForm } from "@/components/staff/walk-in-form";
import { BookingManager } from "@/components/staff/booking-manager";
import { BookingQueue } from "@/components/staff/booking-queue";
import { RoomsBoard } from "@/components/staff/rooms-board";

type TabId = "frontdesk" | "rooms";

export default function StaffHome() {
  const { user, authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isStaff(user?.role)) router.replace("/login");
  }, [authLoading, user, router]);

  const role = user?.role;
  const canFrontdesk =
    role === "frontdesk" || role === "manager" || role === "admin";
  const canRooms =
    role === "housekeeping" || role === "manager" || role === "admin";

  const tabs = useMemo(() => {
    const t: { id: TabId; label: string }[] = [];
    if (canFrontdesk) t.push({ id: "frontdesk", label: "Front desk" });
    if (canRooms) t.push({ id: "rooms", label: "Housekeeping" });
    return t;
  }, [canFrontdesk, canRooms]);

  const [tab, setTab] = useState<TabId>("frontdesk");
  useEffect(() => {
    if (tabs.length && !tabs.find((t) => t.id === tab)) setTab(tabs[0].id);
  }, [tabs, tab]);

  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [lookup, setLookup] = useState("");

  if (authLoading || !isStaff(user?.role)) {
    return <div className="p-16 text-dim">Loading…</div>;
  }

  return (
    <>
      <SiteNav />
      <main className="px-6 py-10 md:px-18">
        <h1 className="font-display text-3xl font-bold">Staff dashboard</h1>
        <p className="mt-1 text-sm text-dim">
          Signed in as {user?.firstName} ·{" "}
          <span className="text-brand-light">{role}</span>
        </p>

        <div className="mb-8 mt-7 flex gap-2 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold",
                tab === t.id
                  ? "border-brand text-fg"
                  : "border-transparent text-dim hover:text-fg",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "frontdesk" && canFrontdesk && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <WalkInForm onCreated={(b) => setActiveBookingId(b.id)} />

            <div className="space-y-5">
              <div className="rounded-2xl border border-border bg-surface p-5">
                <label className="mb-2 block text-sm font-semibold text-muted">
                  Manage a booking
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste booking ID"
                    value={lookup}
                    onChange={(e) => setLookup(e.target.value)}
                  />
                  <Button
                    variant="secondary"
                    onClick={() => setActiveBookingId(lookup.trim() || null)}
                  >
                    Load
                  </Button>
                </div>
                <p className="mt-2 text-xs text-faint">
                  New walk-ins load here automatically — ready to check in.
                </p>
              </div>

              <BookingQueue
                onSelect={setActiveBookingId}
                activeId={activeBookingId}
              />

              {activeBookingId && <BookingManager bookingId={activeBookingId} />}
            </div>
          </div>
        )}

        {tab === "rooms" && canRooms && <RoomsBoard />}
      </main>
    </>
  );
}
