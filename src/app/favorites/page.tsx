import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Favourites" };

export default async function FavoritesPage() {
  await requireUser();
  const supabase = await supabaseServer();

  const { data: favorites } = await supabase
    .from("favorites")
    .select(
      `id, created_at,
       clubs(slug, name, cities(slug)),
       events(slug, name, clubs(name, cities(slug)))`
    )
    .order("created_at", { ascending: false });

  const rows = favorites ?? [];

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="font-display text-2xl font-semibold">Favourites</h1>
        {rows.length === 0 ? (
          <div className="mt-8 rounded-md border border-line bg-night-raised p-8 text-center">
            <p className="text-sm text-moon-dim">
              Nothing saved yet. Tap the heart on a club or event to keep it
              here.
            </p>
            <Link
              href="/clubs"
              className={buttonVariants({ variant: "secondary" }) + " mt-4"}
            >
              Explore clubs
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {rows.map((f) => {
              const club = f.clubs;
              const event = f.events;
              const href = club
                ? `/${club.cities?.slug}/clubs/${club.slug}`
                : event
                  ? `/${event.clubs?.cities?.slug}/events/${event.slug}`
                  : "/";
              const label = club?.name ?? event?.name ?? "Listing";
              return (
                <li key={f.id}>
                  <Link
                    href={href}
                    className="block rounded-md border border-line bg-night-raised px-4 py-3 hover:border-moon-dim"
                  >
                    <span className="font-display font-semibold">{label}</span>
                    {event?.clubs?.name && (
                      <span className="ml-2 text-sm text-moon-dim">
                        at {event.clubs.name}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}
