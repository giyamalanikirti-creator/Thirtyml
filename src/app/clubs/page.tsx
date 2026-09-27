import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { ClubCard } from "@/components/catalog/club-card";
import { FiltersBar } from "@/components/catalog/filters-bar";
import { ClubMapLazy } from "@/components/map/club-map-lazy";
import { getCities, listClubs } from "@/lib/data/catalog";
import { DEFAULT_CITY } from "@/lib/cities";

export const metadata: Metadata = {
  title: "Explore clubs",
  description: "Every club on ThirtyML with live entry prices.",
};

export default async function ClubsPage({
  searchParams,
}: {
  searchParams: Promise<{
    city?: string;
    q?: string;
    genre?: string;
    maxPrice?: string;
    sort?: string;
    open?: string;
  }>;
}) {
  const sp = await searchParams;
  const cities = await getCities();
  const city =
    cities.find((c) => c.slug === sp.city)?.slug ??
    cities[0]?.slug ??
    DEFAULT_CITY;
  const cityInfo = cities.find((c) => c.slug === city)!;

  const clubs = await listClubs({
    city,
    q: sp.q,
    genre: sp.genre,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    openTonight: sp.open === "1",
    sort: (sp.sort as "popularity" | "price_asc" | "price_desc" | "rating") ?? "popularity",
  });

  const pins = clubs
    .filter((c) => c.lat !== null && c.lng !== null)
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      citySlug: c.citySlug,
      lat: c.lat!,
      lng: c.lng!,
      minPrice: c.minPrice,
    }));

  return (
    <>
      <Header city={city} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="font-display text-2xl font-semibold">Explore clubs</h1>
        <div className="mt-4">
          <Suspense>
            <FiltersBar cities={cities} />
          </Suspense>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div>
            {clubs.length === 0 ? (
              <p className="rounded-md border border-line bg-night-raised p-6 text-sm text-moon-dim">
                Nothing matches those filters. Try widening the price range or
                clearing the genre.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {clubs.map((club) => (
                  <ClubCard key={club.id} club={club} />
                ))}
              </div>
            )}
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <ClubMapLazy
                pins={pins}
                center={[cityInfo.lat, cityInfo.lng]}
                zoom={11}
                height="calc(100vh - 120px)"
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
