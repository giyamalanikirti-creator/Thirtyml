import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { ClubCard } from "@/components/catalog/club-card";
import { EventCard } from "@/components/catalog/event-card";
import { Input } from "@/components/ui/input";
import { getCities, listClubs, listEvents } from "@/lib/data/catalog";
import { CITY_COOKIE, DEFAULT_CITY } from "@/lib/cities";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const cookieStore = await cookies();
  const cities = await getCities();
  const city =
    cities.find((c) => c.slug === cookieStore.get(CITY_COOKIE)?.value)?.slug ??
    cities[0]?.slug ??
    DEFAULT_CITY;

  const query = q.trim();
  const [clubs, events] = query
    ? await Promise.all([
        listClubs({ city, q: query }),
        listEvents(city).then((es) =>
          es.filter(
            (e) =>
              e.name.toLowerCase().includes(query.toLowerCase()) ||
              e.clubName.toLowerCase().includes(query.toLowerCase())
          )
        ),
      ])
    : [[], []];

  return (
    <>
      <Header city={city} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <h1 className="font-display text-2xl font-semibold">Search</h1>
        <form action="/search" className="mt-4" role="search">
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Clubs, events, areas…"
            autoFocus
            className="h-12 text-base"
          />
        </form>

        {query && clubs.length === 0 && events.length === 0 && (
          <p className="mt-8 text-sm text-moon-dim">
            Nothing found for “{query}” in your city. Try a different spelling
            or switch city from the header.
          </p>
        )}

        {clubs.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 font-display text-lg font-semibold">Clubs</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {clubs.map((club) => (
                <ClubCard key={club.id} club={club} />
              ))}
            </div>
          </section>
        )}

        {events.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 font-display text-lg font-semibold">Events</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
