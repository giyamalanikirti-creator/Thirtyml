import type { Metadata } from "next";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { EventCard } from "@/components/catalog/event-card";
import { getCities, listEvents } from "@/lib/data/catalog";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Events",
  description: "Guest DJs, theme nights and festivals across ThirtyML cities.",
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city } = await searchParams;
  const cities = await getCities();
  const activeCity = cities.find((c) => c.slug === city)?.slug;
  const events = await listEvents(activeCity);

  return (
    <>
      <Header city={activeCity} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="font-display text-2xl font-semibold">Events</h1>

        <div className="mt-4 flex gap-2" role="radiogroup" aria-label="City">
          <Link
            href="/events"
            role="radio"
            aria-checked={!activeCity}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              !activeCity
                ? "border-sodium bg-sodium/15 text-sodium"
                : "border-line text-moon-dim hover:text-moon"
            )}
          >
            All cities
          </Link>
          {cities.map((c) => (
            <Link
              key={c.slug}
              href={`/events?city=${c.slug}`}
              role="radio"
              aria-checked={activeCity === c.slug}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                activeCity === c.slug
                  ? "border-sodium bg-sodium/15 text-sodium"
                  : "border-line text-moon-dim hover:text-moon"
              )}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {events.length === 0 ? (
          <p className="mt-8 rounded-md border border-line bg-night-raised p-6 text-sm text-moon-dim">
            No upcoming events here yet — check back soon.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
