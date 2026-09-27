import Link from "next/link";
import { cookies } from "next/headers";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { LiveBoard } from "@/components/catalog/live-board";
import { ClubCard } from "@/components/catalog/club-card";
import { EventCard } from "@/components/catalog/event-card";
import {
  getCities,
  getPriceBoard,
  listClubs,
  listEvents,
} from "@/lib/data/catalog";
import { CITY_COOKIE, DEFAULT_CITY } from "@/lib/cities";

export default async function Home() {
  const cookieStore = await cookies();
  const cities = await getCities();
  const cookieCity = cookieStore.get(CITY_COOKIE)?.value;
  const city =
    cities.find((c) => c.slug === cookieCity)?.slug ??
    cities[0]?.slug ??
    DEFAULT_CITY;
  const cityName = cities.find((c) => c.slug === city)?.name ?? city;

  const [board, clubs, events] = await Promise.all([
    getPriceBoard(city),
    listClubs({ city, sort: "popularity" }),
    listEvents(city),
  ]);

  return (
    <>
      <Header city={city} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4">
        <section className="py-10 sm:py-14">
          <p className="text-sm text-moon-dim">
            Tonight in {cityName} ·{" "}
            {new Intl.DateTimeFormat("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "short",
              timeZone: "Asia/Kolkata",
            }).format(new Date())}
          </p>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            The night, priced live.
          </h1>
          <p className="mt-3 max-w-xl text-moon-dim">
            Clubs set their own prices in real time. What you see is what you
            pay — entry, tables and event tickets, locked the moment you check
            out.
          </p>

          <Card className="mt-8">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <h2 className="font-display font-semibold">
                  Live price board
                </h2>
                <Badge variant="sodium">
                  <span
                    aria-hidden
                    className="inline-block h-1.5 w-1.5 rounded-full bg-sodium"
                  />
                  live
                </Badge>
              </div>
              <LiveBoard citySlug={city} initial={board} />
            </CardContent>
          </Card>
        </section>

        {clubs.length > 0 && (
          <section className="py-8">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display text-2xl font-semibold">Tonight</h2>
              <Link href="/clubs" className="text-sm text-dusk hover:underline">
                Explore all clubs
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {clubs.slice(0, 4).map((club) => (
                <ClubCard key={club.id} club={club} />
              ))}
            </div>
          </section>
        )}

        {events.length > 0 && (
          <section className="py-8">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display text-2xl font-semibold">
                Upcoming events
              </h2>
              <Link href="/events" className="text-sm text-dusk hover:underline">
                All events
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {events.slice(0, 4).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        <section className="border-t border-line py-12">
          <h2 className="font-display text-2xl font-semibold">How it works</h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            <li>
              <h3 className="font-medium">1. Watch the board</h3>
              <p className="mt-1 text-sm text-moon-dim">
                Prices are set by the clubs and update the second they change.
              </p>
            </li>
            <li>
              <h3 className="font-medium">2. Lock your price</h3>
              <p className="mt-1 text-sm text-moon-dim">
                Start checkout and your price is held for 10 minutes, whatever
                the board does.
              </p>
            </li>
            <li>
              <h3 className="font-medium">3. Walk in with a QR</h3>
              <p className="mt-1 text-sm text-moon-dim">
                Your ticket is a QR code scanned at the door. No printouts.
              </p>
            </li>
          </ol>
        </section>

        <section className="mb-12 rounded-lg border border-line bg-aubergine/60 px-6 py-10 text-center">
          <h2 className="font-display text-2xl font-semibold">Run a club?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-moon-dim">
            Set your own prices, publish events, manage tables and check guests
            in — with payouts straight to your account.
          </p>
          <Link
            href="/for-clubs"
            className={
              buttonVariants({ variant: "primary", size: "lg" }) + " mt-6"
            }
          >
            Partner with ThirtyML
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
