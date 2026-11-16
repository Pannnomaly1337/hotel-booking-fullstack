import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";

export const metadata: Metadata = {
  title: "Hotel Booking",
  description: "Hotel Booking System — Next.js + NestJS + Prisma",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
