import Link from "next/link";
import { Star } from "lucide-react";
import type { ClubSummary } from "@/lib/data/types";
import { Badge } from "@/components/ui/badge";
import { formatPaise } from "@/lib/utils";

/** Deterministic night-gradient placeholder until clubs upload photos. */
export function clubGradient(slug: string): string {
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  const h1 = hash;
  const h2 = (hash + 40) % 360;
  return `linear-gradient(135deg, hsl(${h1} 45% 22%), hsl(${h2} 55% 12%))`;
}

export function ClubCard({ club }: { club: ClubSummary }) {
  return (
    <Link
      href={`/${club.citySlug}/clubs/${club.slug}`}
      className="group overflow-hidden rounded-md border border-line bg-night-raised transition-colors hover:border-moon-dim"
    >
      <div
        aria-hidden
        className="flex h-32 items-end p-3"
        style={{ background: clubGradient(club.slug) }}
      >
        {!club.isClaimed && <Badge>Unclaimed listing</Badge>}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display font-semibold leading-tight">
              {club.name}
            </h3>
            <p className="mt-0.5 text-xs text-moon-dim">
              {club.areaName}
              {club.genres.length > 0 && ` · ${club.genres.slice(0, 2).join(", ")}`}
            </p>
          </div>
          {club.avgRating !== null && (
            <span className="inline-flex items-center gap-1 text-sm">
              <Star className="h-3.5 w-3.5 fill-sodium text-sodium" aria-hidden />
              {club.avgRating.toFixed(1)}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between">
          {club.minPrice !== null ? (
            <span className="tnum font-display text-sm font-semibold text-sodium">
              {club.minPrice === 0 ? "Free entry" : `from ${formatPaise(club.minPrice)}`}
            </span>
          ) : (
            <span className="text-sm text-moon-dim">No entry on sale</span>
          )}
          {club.openTonight ? (
            <Badge variant="drop">Open tonight</Badge>
          ) : (
            <Badge>Closed tonight</Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
