import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Star, MapPin, Globe, AtSign, Share2 } from "lucide-react";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DateStrip } from "@/components/catalog/date-strip";
import { LivePricePanel } from "@/components/catalog/live-price-panel";
import { Sparkline } from "@/components/catalog/sparkline";
import { EventCard } from "@/components/catalog/event-card";
import { clubGradient } from "@/components/catalog/club-card";
import { ClubMapLazy } from "@/components/map/club-map-lazy";
import { getClubDetail, todayIst } from "@/lib/data/catalog";

export const revalidate = 300;

type Params = { city: string; slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { city, slug } = await params;
  const club = await getClubDetail(city, slug);
  if (!club) return {};
  return {
    title: `${club.name}, ${club.areaName ?? city} — live entry prices`,
    description:
      club.description ??
      `Book entry and tables at ${club.name} at live prices on ThirtyML.`,
    alternates: { canonical: `/${city}/clubs/${slug}` },
  };
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function ClubPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { city, slug } = await params;
  const { date } = await searchParams;
  const selectedDate =
    date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayIst();
  const club = await getClubDetail(city, slug, selectedDate);
  if (!club) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NightClub",
    name: club.name,
    address: club.address ?? undefined,
    geo:
      club.lat && club.lng
        ? { "@type": "GeoCoordinates", latitude: club.lat, longitude: club.lng }
        : undefined,
    aggregateRating:
      club.avgRating !== null
        ? {
            "@type": "AggregateRating",
            ratingValue: club.avgRating,
            reviewCount: club.ratingCount,
          }
        : undefined,
    url: `/${city}/clubs/${slug}`,
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
          / {club.name}
        </nav>

        <div className="relative mt-4 h-56 overflow-hidden rounded-xl sm:h-72">
          {club.imageUrl ? (
            <Image
              src={club.imageUrl}
              alt={club.name}
              fill
              priority
              sizes="(min-width: 1024px) 72rem, 100vw"
              className="object-cover"
            />
          ) : (
            <div aria-hidden className="absolute inset-0" style={{ background: clubGradient(club.slug) }} />
          )}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-night via-night/40 to-transparent" />
        </div>

        <div className="mt-6 flex flex-col gap-8 lg:flex-row">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-bold tracking-tight">
                {club.name}
              </h1>
              {club.avgRating !== null && (
                <span className="inline-flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-sodium text-sodium" aria-hidden />
                  {club.avgRating.toFixed(1)}
                  <span className="text-moon-dim">({club.ratingCount})</span>
                </span>
              )}
              {!club.isClaimed && (
                <Badge>
                  Unclaimed listing ·{" "}
                  <Link
                    href={`/partner/claim/${club.slug}`}
                    className="underline"
                  >
                    Claim this club
                  </Link>
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-moon-dim">
              {club.areaName} · {club.minAge}+ · {club.dressCode ?? "Casual"}
              {club.genres.length > 0 && ` · ${club.genres.join(", ")}`}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {club.websiteUrl && (
                <a
                  href={club.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  <Globe className="h-4 w-4" aria-hidden /> Visit website
                </a>
              )}
              {club.instagramUrl && (
                <a
                  href={club.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  <AtSign className="h-4 w-4" aria-hidden /> Instagram
                </a>
              )}
              {club.lat && club.lng && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${club.lat},${club.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  <MapPin className="h-4 w-4" aria-hidden /> Get directions
                </a>
              )}
              <span
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                <Share2 className="h-4 w-4" aria-hidden /> Share
              </span>
            </div>

            <section className="mt-8">
              <h2 className="mb-3 font-display text-lg font-semibold">
                Pick your night
              </h2>
              <Suspense>
                <DateStrip selected={selectedDate} />
              </Suspense>
            </section>

            {club.description && (
              <section className="mt-8">
                <h2 className="mb-2 font-display text-lg font-semibold">
                  About
                </h2>
                <p className="max-w-2xl text-sm leading-relaxed text-moon-dim">
                  {club.description}
                </p>
              </section>
            )}

            {club.hasTables && (
              <section className="mt-8 rounded-md border border-line bg-night-raised p-5">
                <h2 className="font-display text-lg font-semibold">
                  Tables &amp; booths
                </h2>
                <p className="mt-1 text-sm text-moon-dim">
                  Pick your table on the floor plan — minimum spends apply.
                </p>
                <Link
                  href={`/${city}/clubs/${slug}/tables?date=${selectedDate}`}
                  className={buttonVariants({ variant: "secondary" }) + " mt-3"}
                >
                  Book a table
                </Link>
              </section>
            )}

            <section className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <h2 className="mb-2 font-display text-lg font-semibold">
                  Timings
                </h2>
                <ul className="space-y-1 text-sm text-moon-dim">
                  {club.hours.map((h) => (
                    <li key={h.dayOfWeek} className="flex justify-between gap-6">
                      <span>{dayNames[h.dayOfWeek]}</span>
                      <span className="tnum">
                        {h.closed ? "Closed" : `${h.opens} – ${h.closes}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                {club.amenities.length > 0 && (
                  <>
                    <h2 className="mb-2 font-display text-lg font-semibold">
                      Amenities
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {club.amenities.map((a) => (
                        <Badge key={a}>{a}</Badge>
                      ))}
                    </div>
                  </>
                )}
                {club.houseRules && (
                  <>
                    <h2 className="mb-2 mt-5 font-display text-lg font-semibold">
                      House rules
                    </h2>
                    <p className="text-sm text-moon-dim">{club.houseRules}</p>
                  </>
                )}
              </div>
            </section>

            {club.events.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-4 font-display text-lg font-semibold">
                  Upcoming here
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {club.events.map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </div>
              </section>
            )}

            {club.lat && club.lng && (
              <section className="mt-8">
                <h2 className="mb-3 font-display text-lg font-semibold">
                  Where it is
                </h2>
                <ClubMapLazy
                  pins={[
                    {
                      id: club.id,
                      slug: club.slug,
                      name: club.name,
                      citySlug: city,
                      lat: club.lat,
                      lng: club.lng,
                      minPrice: club.minPrice,
                    },
                  ]}
                  center={[club.lat, club.lng]}
                  zoom={15}
                  height="280px"
                />
                {club.address && (
                  <p className="mt-2 text-sm text-moon-dim">{club.address}</p>
                )}
              </section>
            )}

            <section className="mt-8">
              <h2 className="mb-4 font-display text-lg font-semibold">
                Reviews
              </h2>
              {club.reviews.length === 0 ? (
                <p className="text-sm text-moon-dim">
                  No reviews yet — be the first after your night out.
                </p>
              ) : (
                <ul className="space-y-4">
                  {club.reviews.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-md border border-line bg-night-raised p-4"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <span className="inline-flex items-center gap-1">
                          <Star
                            className="h-3.5 w-3.5 fill-sodium text-sodium"
                            aria-hidden
                          />
                          {r.rating}
                        </span>
                        <span className="text-moon-dim">
                          {r.authorName} ·{" "}
                          {new Intl.DateTimeFormat("en-IN", {
                            day: "numeric",
                            month: "short",
                          }).format(new Date(r.createdAt))}
                        </span>
                      </div>
                      {r.body && <p className="mt-2 text-sm">{r.body}</p>}
                      {r.reply && (
                        <p className="mt-2 border-l-2 border-dusk pl-3 text-sm text-moon-dim">
                          Reply from {club.name}: {r.reply}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="w-full lg:w-96 lg:shrink-0">
            <Card className="lg:sticky lg:top-20">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>
                  {selectedDate === todayIst()
                    ? "Tonight's prices"
                    : "Prices for the night"}
                </CardTitle>
                {club.priceHistory.length > 1 && (
                  <Sparkline points={club.priceHistory} />
                )}
              </CardHeader>
              <CardContent>
                {club.openTonight ? (
                  <LivePricePanel
                    products={club.entryProducts}
                    date={selectedDate}
                  />
                ) : (
                  <p className="text-sm text-moon-dim">
                    Closed on this night. Pick another date above.
                  </p>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
