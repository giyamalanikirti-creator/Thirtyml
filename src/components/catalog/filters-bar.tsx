"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

const GENRES = ["Bollywood", "Techno", "EDM", "Hip-hop", "Commercial", "House"];
const PRICES = [
  { label: "Any price", value: "" },
  { label: "Under ₹1,000", value: "100000" },
  { label: "Under ₹2,000", value: "200000" },
  { label: "Under ₹3,000", value: "300000" },
];
const SORTS = [
  { label: "Popular", value: "popularity" },
  { label: "Price: low to high", value: "price_asc" },
  { label: "Price: high to low", value: "price_desc" },
  { label: "Rating", value: "rating" },
];

/** Explore filters, synced to the URL so results are shareable. */
export function FiltersBar({ cities }: { cities: { slug: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = React.useState(params.get("q") ?? "");

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const selectClass =
    "h-9 rounded-sm border border-line bg-night-raised px-2 text-sm text-moon";

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setParam("q", q);
      }}
      role="search"
      aria-label="Filter clubs"
    >
      <Input
        placeholder="Search clubs or areas…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onBlur={() => setParam("q", q)}
        className="w-48"
      />
      <select
        aria-label="City"
        className={selectClass}
        value={params.get("city") ?? cities[0]?.slug ?? "mumbai"}
        onChange={(e) => setParam("city", e.target.value)}
      >
        {cities.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        aria-label="Genre"
        className={selectClass}
        value={params.get("genre") ?? ""}
        onChange={(e) => setParam("genre", e.target.value)}
      >
        <option value="">All genres</option>
        {GENRES.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
      <select
        aria-label="Price"
        className={selectClass}
        value={params.get("maxPrice") ?? ""}
        onChange={(e) => setParam("maxPrice", e.target.value)}
      >
        {PRICES.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      <select
        aria-label="Sort"
        className={selectClass}
        value={params.get("sort") ?? "popularity"}
        onChange={(e) => setParam("sort", e.target.value)}
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <label className="inline-flex items-center gap-1.5 text-sm text-moon-dim">
        <input
          type="checkbox"
          checked={params.get("open") === "1"}
          onChange={(e) => setParam("open", e.target.checked ? "1" : "")}
        />
        Open tonight
      </label>
    </form>
  );
}
