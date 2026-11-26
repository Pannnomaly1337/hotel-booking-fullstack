import type { Metadata } from "next";
import { Unbounded, Montserrat } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const display = Unbounded({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-unbounded",
});
const sans = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Aurelia — A boutique hotel in Bangkok",
  description:
    "A quiet hideaway of light-filled rooms. Book your stay at Aurelia.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-ink text-fg antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
