import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LiveBoard } from "@/components/catalog/live-board";
import { ClubCard } from "@/components/catalog/club-card";
import { EventCard } from "@/components/catalog/event-card";
import {
  getCities,
  getPriceBoard,
  listClubs,
  listEvents,
} from "@/lib/data/catalog";

export const revalidate = 300;

type Params = { city: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { city } = await params;
  const cities = await getCities();
  const match = cities.find((c) => c.slug === city);
  if (!match) return {};
  return {
    title: `Nightlife in ${match.name} — live club entry prices`,
    description: `Live entry prices, tables and events at ${match.name}'s best clubs. Book on ThirtyML and pay exactly what you see.`,
    alternates: { canonical: `/${match.slug}` },
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { city } = await params;
  const cities = await getCities();
  const match = cities.find((c) => c.slug === city);
  if (!match) notFound();

  const [board, clubs, events] = await Promise.all([
    getPriceBoard(city),
    listClubs({ city, sort: "popularity" }),
    listEvents(city),
  ]);

  return (
    <>
      <Header city={city} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <nav aria-label="Breadcrumb" className="text-xs text-moon-dim">
          <Link href="/" className="hover:text-moon">Home</Link> / {match.name}
        </nav>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
          Nightlife in {match.name}
        </h1>

        <Card className="mt-6">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <h2 className="font-display font-semibold">
                Tonight&apos;s live board
              </h2>
              <Badge variant="sodium">live</Badge>
            </div>
            <LiveBoard citySlug={city} initial={board} />
          </CardContent>
        </Card>

        <section className="mt-10">
          <h2 className="mb-4 font-display text-2xl font-semibold">
            Clubs in {match.name}
          </h2>
          {clubs.length === 0 ? (
            <p className="text-sm text-moon-dim">
              No clubs listed here yet — know one?{" "}
              <Link href="/partner/apply" className="text-dusk hover:underline">
                Tell them about ThirtyML
              </Link>
              .
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clubs.map((club) => (
                <ClubCard key={club.id} club={club} />
              ))}
            </div>
          )}
        </section>

        {events.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 font-display text-2xl font-semibold">
              Events in {match.name}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
