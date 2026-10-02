import Image from "next/image";
import Link from "next/link";
import { Calendar } from "lucide-react";
import type { EventSummary } from "@/lib/data/types";
import { clubGradient } from "./club-card";
import { formatPaise } from "@/lib/utils";

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Asia/Kolkata",
});
const timeFmt = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

export function EventCard({ event }: { event: EventSummary }) {
  const starts = new Date(event.startsAt);
  return (
    <Link
      href={`/${event.citySlug}/events/${event.slug}`}
      className="card-lift group block overflow-hidden rounded-lg border border-line bg-night-raised"
    >
      <div className="relative aspect-[3/2] overflow-hidden">
        {event.posterPath ? (
          <Image
            src={event.posterPath}
            alt={event.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: clubGradient(event.slug) }}
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-night via-night/40 to-transparent"
        />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-night/80 px-2 py-1 text-xs text-moon backdrop-blur">
          <Calendar className="h-3 w-3 text-plum-bright" aria-hidden />
          <span>
            {dateFmt.format(starts)} · {timeFmt.format(starts)}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display text-base font-semibold leading-tight text-moon group-hover:text-plum-bright">
          {event.name}
        </h3>
        <p className="mt-1 text-xs text-moon-dim">{event.clubName}</p>
        {event.minPrice !== null && (
          <p className="tnum mt-2 text-sm">
            <span className="text-moon-dim">from </span>
            <span className="font-display font-semibold text-plum-bright">
              {formatPaise(event.minPrice)}
            </span>
          </p>
        )}
      </div>
    </Link>
  );
}
