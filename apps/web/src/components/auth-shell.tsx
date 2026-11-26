import Link from "next/link";
import { cn } from "@/lib/utils";

export function AuthShell({
  tab,
  children,
}: {
  tab: "login" | "register";
  children: React.ReactNode;
}) {
  const tabCls = (active: boolean) =>
    cn(
      "flex-1 rounded-lg py-2.5 text-center text-sm font-semibold transition-colors",
      active ? "bg-brand text-ink" : "text-dim hover:text-fg",
    );

  return (
    <div className="flex min-h-screen flex-wrap">
      {/* แผงแบรนด์ */}
      <div className="flex min-w-0 flex-[1_1_440px] flex-col justify-between bg-gradient-to-br from-brand-dark via-[#2a1a52] to-[#120b22] p-10 md:p-16">
        <Link href="/" className="font-display text-2xl font-bold tracking-wide">
          AURELIA
        </Link>
        <div className="py-10">
          <h1 className="mb-5 font-display text-4xl font-bold leading-tight text-white md:text-5xl">
            Welcome back to the quiet.
          </h1>
          <p className="max-w-sm text-lg leading-relaxed text-[#e4def7]">
            Sign in to manage your bookings, see your stays, and pick up where
            you left off.
          </p>
        </div>
        <p className="text-sm text-[#c9bef0]">© 2026 Aurelia Hotel · Bangkok</p>
      </div>

      {/* แผงฟอร์ม */}
      <div className="flex min-w-0 flex-[999_1_520px] items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex gap-1.5 rounded-xl border border-border bg-surface p-1.5">
            <Link href="/login" className={tabCls(tab === "login")}>
              Sign in
            </Link>
            <Link href="/register" className={tabCls(tab === "register")}>
              Create account
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
