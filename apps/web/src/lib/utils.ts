import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTHB(amount: string | number): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(n)) return "฿0";
  return `฿${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function safeInternalPath(p: string | null | undefined): string | null {
  if (!p) return null;
  if (!p.startsWith("/") || p.startsWith("//") || p.startsWith("/\\")) {
    return null;
  }
  return p;
}
