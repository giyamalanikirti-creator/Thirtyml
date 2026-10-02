import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { ArrowRight, Zap, Lock, QrCode } from "lucide-react";
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

  const heroClub = clubs.find((c) => c.imageUrl) ?? clubs[0];

  return (
    <>
      <Header city={city} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4">
        {/* HERO ---------------------------------------------------------- */}
        <section className="relative overflow-hidden rounded-xl border border-line bg-aubergine/40 pt-10 sm:pt-14">
          {heroClub?.imageUrl && (
            <>
              <Image
                src={heroClub.imageUrl}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 72rem, 100vw"
                className="absolute inset-0 -z-10 object-cover opacity-25"
              />
              <div
                aria-hidden
                className="absolute inset-0 -z-10 bg-gradient-to-tr from-night via-night/70 to-transparent"
              />
            </>
          )}
          <div className="relative mx-auto max-w-2xl px-6 pb-14 sm:px-10 sm:pb-20">
            <Badge variant="sodium" className="mb-4">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-plum-bright" />
              Live in {cityName} tonight
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              The night, <span className="text-plum-bright">priced live.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-moon-dim sm:text-lg">
              Clubs set their own prices in real time. See what you&apos;ll pay
              before you leave the house — entry, tables and event tickets,
              locked the moment you check out.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/clubs"
                className={buttonVariants({ variant: "primary", size: "lg" })}
              >
                Explore clubs <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/events"
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                See events
              </Link>
            </div>
          </div>
        </section>

        {/* LIVE BOARD ---------------------------------------------------- */}
        <section className="mt-10">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold">
              Tonight&apos;s live board
            </h2>
            <span className="text-xs text-moon-dim">
              {new Intl.DateTimeFormat("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "short",
                timeZone: "Asia/Kolkata",
              }).format(new Date())}
            </span>
          </div>
          <Card>
            <CardContent className="p-0">
              <LiveBoard citySlug={city} initial={board} />
            </CardContent>
          </Card>
        </section>

        {/* CLUB RAIL ----------------------------------------------------- */}
        {clubs.length > 0 && (
          <section className="mt-14">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display text-2xl font-semibold">
                Popular in {cityName}
              </h2>
              <Link
                href="/clubs"
                className="inline-flex items-center gap-1 text-sm text-plum-bright hover:underline"
              >
                All clubs <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {clubs.slice(0, 4).map((club) => (
                <ClubCard key={club.id} club={club} />
              ))}
            </div>
          </section>
        )}

        {/* EVENT RAIL ---------------------------------------------------- */}
        {events.length > 0 && (
          <section className="mt-14">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display text-2xl font-semibold">
                Upcoming events
              </h2>
              <Link
                href="/events"
                className="inline-flex items-center gap-1 text-sm text-plum-bright hover:underline"
              >
                All events <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {events.slice(0, 4).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* HOW IT WORKS -------------------------------------------------- */}
        <section className="mt-16 rounded-xl border border-line bg-night-raised/70 px-6 py-10">
          <h2 className="font-display text-2xl font-semibold">How it works</h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            <HowStep
              icon={<Zap className="h-5 w-5" />}
              step="1"
              title="Watch the board"
              body="Prices are set by the clubs and update the second they change."
            />
            <HowStep
              icon={<Lock className="h-5 w-5" />}
              step="2"
              title="Lock your price"
              body="Start checkout and your price is held for 10 minutes, whatever the board does."
            />
            <HowStep
              icon={<QrCode className="h-5 w-5" />}
              step="3"
              title="Walk in with a QR"
              body="Your ticket is a QR code scanned at the door. No printouts."
            />
          </ol>
        </section>

        {/* PARTNER CTA --------------------------------------------------- */}
        <section className="my-16 overflow-hidden rounded-xl border border-plum/30 bg-gradient-to-br from-plum-wash to-aubergine px-6 py-10 text-center sm:px-10">
          <Badge variant="sodium" className="mb-3">For clubs</Badge>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Fill the room at the right price — every night.
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-moon-dim">
            Set your own prices, publish events, manage tables and check guests
            in — with payouts straight to your account.
          </p>
          <Link
            href="/for-clubs"
            className={
              buttonVariants({ variant: "primary", size: "lg" }) + " mt-6"
            }
          >
            Partner with ThirtyML <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}

function HowStep({
  icon,
  step,
  title,
  body,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  body: string;
}) {
  return (
    <li>
      <div className="flex items-center gap-2 text-plum-bright">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-plum/20">
          {icon}
        </span>
        <span className="text-xs font-medium uppercase tracking-widest text-moon-dim">
          Step {step}
        </span>
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-moon-dim">{body}</p>
    </li>
  );
}
