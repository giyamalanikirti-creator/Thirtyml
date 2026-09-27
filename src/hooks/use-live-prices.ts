"use client";

import * as React from "react";
import { supabaseBrowser, supabaseConfigured } from "@/lib/supabase/client";

export interface LivePrice {
  price: number;
  priceUpdatedAt: string | null;
  available: number;
}

/**
 * Live prices for a set of products on a date. Subscribes to Supabase
 * Realtime on `products` and `price_overrides`; on any change re-fetches
 * from the `catalog_prices` RPC (the single source of truth) so the numbers
 * shown are always the server's, never derived client-side.
 */
export function useLivePrices(
  productIds: string[],
  date: string,
  initial?: Record<string, LivePrice>
) {
  const [prices, setPrices] = React.useState<Record<string, LivePrice>>(
    initial ?? {}
  );
  const idsKey = productIds.slice().sort().join(",");

  React.useEffect(() => {
    if (!supabaseConfigured() || productIds.length === 0) return;
    const supabase = supabaseBrowser();
    let cancelled = false;

    async function refresh() {
      const { data } = await supabase.rpc("catalog_prices", {
        p_product_ids: productIds,
        p_date: date,
      });
      if (cancelled || !data) return;
      setPrices((prev) => {
        const next = { ...prev };
        for (const row of data) {
          next[row.product_id] = {
            price: row.price ?? 0,
            priceUpdatedAt: row.price_updated_at,
            available: row.available ?? 0,
          };
        }
        return next;
      });
    }

    refresh();
    const channel = supabase
      .channel(`prices:${idsKey.slice(0, 40)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload) => {
          const id = (payload.new as { id?: string })?.id;
          if (id && productIds.includes(id)) refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "price_overrides" },
        (payload) => {
          const id = (payload.new as { product_id?: string })?.product_id;
          if (id && productIds.includes(id)) refresh();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, date]);

  return prices;
}
