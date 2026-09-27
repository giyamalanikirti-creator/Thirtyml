"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const dayFmt = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  timeZone: "Asia/Kolkata",
});
const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  timeZone: "Asia/Kolkata",
});
const isoFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" });

function buildDays() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() + i * 86400000);
    return { iso: isoFmt.format(d), day: dayFmt.format(d), num: dateFmt.format(d) };
  });
}

/** 14-night date selector synced to the `date` query param. */
export function DateStrip({ selected }: { selected: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const days = React.useMemo(() => buildDays(), []);

  function pick(iso: string) {
    const next = new URLSearchParams(params.toString());
    next.set("date", iso);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1"
      role="radiogroup"
      aria-label="Pick a night"
    >
      {days.map((d, i) => (
        <button
          key={d.iso}
          role="radio"
          aria-checked={selected === d.iso}
          onClick={() => pick(d.iso)}
          className={cn(
            "flex min-w-14 flex-col items-center rounded-md border px-3 py-2 text-sm transition-colors",
            selected === d.iso
              ? "border-sodium bg-sodium/15 text-sodium"
              : "border-line bg-night-raised text-moon-dim hover:text-moon"
          )}
        >
          <span className="text-xs">{i === 0 ? "Tonight" : d.day}</span>
          <span className="tnum font-display font-semibold">{d.num}</span>
        </button>
      ))}
    </div>
  );
}
