import Link from "next/link";
import { Wine, Waves, Coffee, KeyRound } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { SearchCard } from "@/components/search-card";
import { Button } from "@/components/ui/button";

const amenities = [
  { icon: Wine, title: "Rooftop bar", desc: "Cocktails over the skyline, every evening." },
  { icon: Waves, title: "Pool & terrace", desc: "A quiet pool and sun loungers." },
  { icon: Coffee, title: "Breakfast all day", desc: "Coffee, tea and snacks, any hour." },
  { icon: KeyRound, title: "Keycard access", desc: "Secure electronic entry throughout." },
];

const featured = [
  { name: "Garden Single", meta: "Single · 24 sqm · Garden view", price: "฿1,200" },
  { name: "Deluxe Double", meta: "Double · 32 sqm · City view", price: "฿2,000" },
  { name: "Twin Suite", meta: "Twin · 36 sqm · Pool view", price: "฿2,400" },
];

export default function HomePage() {
  return (
    <>
      <SiteNav />

      <main>
        {/* HERO */}
        <section className="px-6 md:px-18">
          <div className="relative mt-9 flex min-h-[560px] flex-col justify-center overflow-hidden rounded-3xl border border-border bg-surface-2 p-10 md:p-18">
            <div className="pointer-events-none absolute -right-20 -top-28 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(142,110,242,0.28),transparent_70%)]" />
            <div className="relative max-w-2xl">
              <div className="mb-5 inline-block text-xs font-semibold uppercase tracking-[3px] text-brand-light">
                A boutique hotel · Bangkok
              </div>
              <h1 className="mb-5 font-display text-5xl font-bold leading-[1.04] md:text-6xl">
                Rest,
                <br />
                reimagined.
              </h1>
              <p className="max-w-md text-lg leading-relaxed text-muted">
                A quiet hideaway of light-filled rooms, a rooftop under the
                stars, and mornings that never rush you.
              </p>
            </div>
          </div>

          <SearchCard />
        </section>

        {/* STORY */}
        <section className="flex flex-wrap items-center gap-14 px-6 py-24 md:px-18">
          <div className="h-80 min-w-0 flex-[1_1_380px] rounded-3xl border border-border bg-[#1b1430]" />
          <div className="min-w-0 flex-[1_1_380px]">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[3px] text-brand">
              Our story
            </div>
            <h2 className="mb-5 font-display text-4xl font-semibold leading-tight">
              A small hotel built around rest
            </h2>
            <p className="mb-7 text-base leading-loose text-muted">
              Aurelia began as a single restored townhouse in a quiet lane.
              Today it&apos;s eighteen rooms, a rooftop bar, and a team that
              remembers how you take your coffee.
            </p>
          </div>
        </section>

        {/* AMENITIES */}
        <section className="px-6 py-6 md:px-18">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {amenities.map((a) => (
              <div
                key={a.title}
                className="rounded-2xl border border-border bg-surface p-7"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#211a36]">
                  <a.icon className="h-5 w-5 text-brand-light" strokeWidth={1.8} />
                </div>
                <h3 className="mb-1.5 text-base font-semibold">{a.title}</h3>
                <p className="text-sm leading-relaxed text-dim">{a.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURED ROOMS */}
        <section className="px-6 py-14 md:px-18">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-[3px] text-brand">
                Our rooms
              </div>
              <h2 className="font-display text-4xl font-semibold">
                Where you&apos;ll rest
              </h2>
            </div>
            <Link
              href="/rooms"
              className="border-b-2 border-brand pb-1 text-sm font-semibold text-fg"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((r) => (
              <Link
                key={r.name}
                href="/rooms"
                className="block overflow-hidden rounded-2xl border border-border bg-surface"
              >
                <div className="h-52 bg-[#241a3a]" />
                <div className="p-6">
                  <h3 className="mb-1.5 font-display text-lg font-semibold">
                    {r.name}
                  </h3>
                  <p className="mb-4 text-sm text-dim">{r.meta}</p>
                  <div>
                    <span className="font-display text-xl font-semibold text-brand-light">
                      {r.price}
                    </span>
                    <span className="text-sm text-faint"> / night</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-24 pt-12 md:px-18">
          <div className="rounded-3xl bg-gradient-to-br from-brand-dark to-brand p-16 text-center">
            <h2 className="mb-4 font-display text-4xl font-bold text-ink">
              Your room is waiting
            </h2>
            <p className="mb-7 text-lg text-ink/80">
              Book direct for the best rate and a late checkout.
            </p>
            <Link href="/rooms">
              <Button variant="secondary" size="lg" pill className="bg-ink text-fg border-0">
                Find your room
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
