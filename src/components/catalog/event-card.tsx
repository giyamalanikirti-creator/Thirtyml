import Link from "next/link";
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
      className="group overflow-hidden rounded-md border border-line bg-night-raised transition-colors hover:border-moon-dim"
    >
      <div
        aria-hidden
        className="flex h-36 items-end p-3"
        style={{ background: clubGradient(event.slug) }}
      >
        <span className="rounded-sm bg-night/80 px-2 py-1 text-xs">
          {dateFmt.format(starts)} · {timeFmt.format(starts)}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-display font-semibold leading-tight">
          {event.name}
        </h3>
        <p className="mt-0.5 text-xs text-moon-dim">{event.clubName}</p>
        {event.minPrice !== null && (
          <p className="tnum mt-2 font-display text-sm font-semibold text-sodium">
            from {formatPaise(event.minPrice)}
          </p>
        )}
      </div>
    </Link>
  );
}
