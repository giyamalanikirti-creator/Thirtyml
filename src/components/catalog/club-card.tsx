import Image from "next/image";
import Link from "next/link";
import { Star, MapPin } from "lucide-react";
import type { ClubSummary } from "@/lib/data/types";
import { Badge } from "@/components/ui/badge";
import { formatPaise } from "@/lib/utils";

/** Deterministic night-gradient placeholder for clubs without a photo. */
export function clubGradient(slug: string): string {
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  const h1 = (260 + (hash % 60)) % 360; // skew purples
  const h2 = (h1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${h1} 55% 24%), hsl(${h2} 65% 12%))`;
}

/** BookMyShow-style card: photo on top, info below, price pill overlaid. */
export function ClubCard({ club }: { club: ClubSummary }) {
  return (
    <Link
      href={`/${club.citySlug}/clubs/${club.slug}`}
      className="card-lift group block overflow-hidden rounded-lg border border-line bg-night-raised"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {club.imageUrl ? (
          <Image
            src={club.imageUrl}
            alt={`${club.name} in ${club.areaName ?? club.citySlug}`}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: clubGradient(club.slug) }}
          />
        )}
        {/* Dark gradient so overlaid chips always stay readable. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-night via-night/30 to-transparent"
        />

        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {club.openTonight ? (
            <Badge variant="drop">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-drop" />
              Open tonight
            </Badge>
          ) : (
            <Badge>Closed tonight</Badge>
          )}
          {club.avgRating !== null && (
            <Badge variant="default" className="bg-night/80 backdrop-blur">
              <Star className="h-3 w-3 fill-plum text-plum" aria-hidden />
              {club.avgRating.toFixed(1)}
            </Badge>
          )}
        </div>

        {club.minPrice !== null && (
          <div className="absolute bottom-3 left-3">
            <div className="rounded-md bg-plum px-3 py-1 shadow-lg shadow-plum/40">
              <p className="text-[10px] font-medium uppercase tracking-widest text-moon">
                Entry from
              </p>
              <p className="tnum font-display text-base font-bold leading-tight text-moon">
                {club.minPrice === 0 ? "Free" : formatPaise(club.minPrice)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-display text-lg font-semibold leading-tight text-moon group-hover:text-plum-bright">
          {club.name}
        </h3>
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-moon-dim">
          <MapPin className="h-3 w-3" aria-hidden />
          {club.areaName}
        </p>
        {club.genres.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {club.genres.slice(0, 3).map((g) => (
              <span
                key={g}
                className="rounded-full border border-line-strong bg-aubergine/60 px-2 py-0.5 text-[10px] text-moon-dim"
              >
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
