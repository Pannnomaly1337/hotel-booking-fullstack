"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { isStaff } from "@/lib/roles";
import { Button } from "@/components/ui/button";

export function SiteNav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const onLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-5 md:px-18">
      <Link
        href="/"
        className="font-display text-xl font-bold tracking-wide text-fg"
      >
        AURELIA
      </Link>

      <nav className="flex items-center gap-5 text-sm font-medium text-muted md:gap-8">
        <Link href="/rooms" className="hidden hover:text-fg sm:inline">
          Rooms
        </Link>

        {user ? (
          <>
            {isStaff(user.role) && (
              <Link href="/staff" className="hover:text-fg">
                Staff
              </Link>
            )}
            {!isStaff(user.role) && (
              <Link href="/bookings" className="hover:text-fg">
                My bookings
              </Link>
            )}
            <span className="hidden text-dim sm:inline">
              Hi, {user.firstName}
            </span>
            <Button variant="secondary" size="sm" onClick={onLogout}>
              Sign out
            </Button>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-fg">
              Sign in
            </Link>
            <Link href="/rooms">
              <Button size="sm" pill>
                Book a stay
              </Button>
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
