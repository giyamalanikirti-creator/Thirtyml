import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clubGradient } from "@/components/catalog/club-card";
import { LivePricePanel } from "@/components/catalog/live-price-panel";
import { ClubMapLazy } from "@/components/map/club-map-lazy";
import { getEventDetail } from "@/lib/data/catalog";
import type { EventDetail } from "@/lib/data/types";

export const revalidate = 300;

type Params = { city: string; slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { city, slug } = await params;
  const event = await getEventDetail(city, slug);
  if (!event) return {};
  return {
    title: `${event.name} at ${event.clubName}`,
    description: event.description ?? `Tickets for ${event.name} on ThirtyML.`,
    alternates: { canonical: `/${city}/events/${slug}` },
  };
}

function tiersOnSale(tiers: EventDetail["tiers"]) {
  const now = Date.now();
  return tiers.filter((t) => {
    const started = !t.salesStartAt || new Date(t.salesStartAt).getTime() <= now;
    const notEnded = !t.salesEndAt || new Date(t.salesEndAt).getTime() > now;
    return started && notEnded;
  });
}

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

export default async function EventPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { city, slug } = await params;
  const event = await getEventDetail(city, slug);
  if (!event) notFound();

  const eventDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date(event.startsAt));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    startDate: event.startsAt,
    endDate: event.endsAt ?? undefined,
    location: {
      "@type": "NightClub",
      name: event.clubName,
      address: event.venueAddress ?? undefined,
    },
    offers: event.tiers.map((t) => ({
      "@type": "Offer",
      name: t.name,
      price: (t.price / 100).toFixed(2),
      priceCurrency: "INR",
      availability:
        t.available > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
    })),
  };

  return (
    <>
      <Header city={city} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <nav aria-label="Breadcrumb" className="text-xs text-moon-dim">
          <Link href="/" className="hover:text-moon">Home</Link> /{" "}
          <Link href={`/${city}`} className="capitalize hover:text-moon">
            {city}
          </Link>{" "}
          / <Link href="/events" className="hover:text-moon">Events</Link> /{" "}
          {event.name}
        </nav>

        <div
          aria-hidden
          className="mt-4 h-56 rounded-lg sm:h-72"
          style={{ background: clubGradient(event.slug) }}
        />

        <div className="mt-6 flex flex-col gap-8 lg:flex-row">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {event.name}
            </h1>
            <p className="mt-1 text-sm text-moon-dim">
              {dateFmt.format(new Date(event.startsAt))} ·{" "}
              <Link
                href={`/${city}/clubs/${event.clubSlug}`}
                className="text-dusk hover:underline"
              >
                {event.clubName}
              </Link>
            </p>

            {event.description && (
              <p className="mt-6 max-w-2xl text-sm leading-relaxed text-moon-dim">
                {event.description}
              </p>
            )}

            {event.lineup.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-2 font-display text-lg font-semibold">
                  Lineup
                </h2>
                <ul className="space-y-1 text-sm">
                  {event.lineup.map((l) => (
                    <li key={l.artist}>
                      {l.artist}
                      {l.genre && (
                        <span className="text-moon-dim"> · {l.genre}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {event.lat && event.lng && (
              <section className="mt-8">
                <h2 className="mb-3 font-display text-lg font-semibold">
                  Venue
                </h2>
                <ClubMapLazy
                  pins={[
                    {
                      id: event.id,
                      slug: event.clubSlug,
                      name: event.clubName,
                      citySlug: city,
                      lat: event.lat,
                      lng: event.lng,
                      minPrice: event.minPrice,
                    },
                  ]}
                  center={[event.lat, event.lng]}
                  zoom={15}
                  height="260px"
                />
              </section>
            )}

            {event.terms && (
              <section className="mt-8">
                <h2 className="mb-2 font-display text-lg font-semibold">
                  Terms
                </h2>
                <p className="max-w-2xl text-sm text-moon-dim">{event.terms}</p>
              </section>
            )}
          </div>

          <aside className="w-full lg:w-96 lg:shrink-0">
            <Card className="lg:sticky lg:top-20">
              <CardHeader>
                <CardTitle>Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <LivePricePanel
                  products={tiersOnSale(event.tiers)}
                  date={eventDate}
                />
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
