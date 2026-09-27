"use client";

import * as React from "react";
import { supabaseBrowser, supabaseConfigured } from "@/lib/supabase/client";
import type { PriceBoardRow } from "@/lib/data/types";

/** Keeps the city price board live by re-running the board RPC on changes. */
export function useLiveBoard(citySlug: string, initial: PriceBoardRow[]) {
  // Live rows are stored per city so switching cities falls back to the
  // server-rendered data until the next realtime refresh, with no reset
  // effect needed.
  const [liveByCity, setLiveByCity] = React.useState<
    Record<string, PriceBoardRow[]>
  >({});
  const rows = liveByCity[citySlug] ?? initial;

  React.useEffect(() => {
    if (!supabaseConfigured()) return;
    const supabase = supabaseBrowser();
    let cancelled = false;
    let pending = false;

    async function refresh() {
      if (pending) return;
      pending = true;
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
      }).format(new Date());
      const { data } = await supabase.rpc("city_price_board", {
        p_city_slug: citySlug,
        p_date: today,
      });
      pending = false;
      if (cancelled || !data) return;
      setLiveByCity((prev) => ({
        ...prev,
        [citySlug]: data.map((r) => ({
          clubId: r.club_id,
          clubSlug: r.club_slug,
          clubName: r.club_name,
          areaName: r.area_name,
          lat: r.lat,
          lng: r.lng,
          minPrice: r.min_price,
          priceUpdatedAt: r.price_updated_at,
          isOpen: r.is_open,
        })),
      }));
    }

    const channel = supabase
      .channel(`board:${citySlug}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "price_overrides" },
        () => refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nights" },
        () => refresh()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [citySlug]);

  return rows;
}
