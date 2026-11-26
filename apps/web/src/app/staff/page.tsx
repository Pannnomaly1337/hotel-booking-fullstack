"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { isStaff } from "@/lib/roles";
import { SiteNav } from "@/components/site-nav";

export default function StaffHome() {
  const { user, authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isStaff(user?.role)) router.replace("/login");
  }, [authLoading, user, router]);

  if (authLoading || !isStaff(user?.role)) {
    return <div className="p-16 text-dim">Loading…</div>;
  }

  return (
    <>
      <SiteNav />
      <main className="px-6 py-16 md:px-18">
        <h1 className="font-display text-3xl font-bold">Staff dashboard</h1>
        <p className="mt-3 text-muted">
          Signed in as {user?.firstName} · role:{" "}
          <span className="font-semibold text-brand-light">{user?.role}</span>
        </p>
        <div className="mt-8 rounded-2xl border border-border bg-surface p-8 text-dim">
          Walk-in booking, check-in / check-out, and housekeeping tools arrive
          in <span className="text-fg">W4</span>.
        </div>
      </main>
    </>
  );
}
