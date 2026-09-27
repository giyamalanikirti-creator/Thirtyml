"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FALLBACK_CITIES, CITY_COOKIE, DEFAULT_CITY } from "@/lib/cities";
import { cn } from "@/lib/utils";

interface City {
  slug: string;
  name: string;
}

export function CitySwitcher({
  cities = [...FALLBACK_CITIES],
  current,
  className,
}: {
  cities?: City[];
  current?: string;
  className?: string;
}) {
  const router = useRouter();
  const [city, setCity] = React.useState(current ?? DEFAULT_CITY);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setCity(next);
    document.cookie = `${CITY_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
    router.push(`/${next}`);
  }

  return (
    <label className={cn("relative inline-flex items-center", className)}>
      <span className="sr-only">Choose your city</span>
      <select
        value={city}
        onChange={onChange}
        className="h-9 appearance-none rounded-sm border border-line bg-night-raised pl-3 pr-8 text-sm text-moon"
      >
        {cities.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute right-2.5 text-moon-dim text-xs"
      >
        ▾
      </span>
    </label>
  );
}
