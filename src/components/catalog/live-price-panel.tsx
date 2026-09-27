"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ProductInfo } from "@/lib/data/types";
import { useLivePrices } from "@/hooks/use-live-prices";
import { PriceTag } from "@/components/price/price-tag";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPaise } from "@/lib/utils";

/**
 * The club page's sticky panel: live entry prices with quantity steppers.
 * Prices update via Realtime; adding to cart posts to the server cart.
 */
export function LivePricePanel({
  products,
  date,
}: {
  products: ProductInfo[];
  date: string;
}) {
  const router = useRouter();
  const initial = React.useMemo(
    () =>
      Object.fromEntries(
        products.map((p) => [
          p.id,
          { price: p.price, priceUpdatedAt: p.priceUpdatedAt, available: p.available },
        ])
      ),
    [products]
  );
  const live = useLivePrices(
    products.map((p) => p.id),
    date,
    initial
  );
  const [qty, setQty] = React.useState<Record<string, number>>({});
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const totalPaise = products.reduce(
    (sum, p) => sum + (live[p.id]?.price ?? p.price) * (qty[p.id] ?? 0),
    0
  );
  const anySelected = Object.values(qty).some((n) => n > 0);

  function step(p: ProductInfo, delta: number) {
    setQty((prev) => {
      const current = prev[p.id] ?? 0;
      const available = live[p.id]?.available ?? p.available;
      const next = Math.max(0, Math.min(current + delta, p.maxPerOrder, available));
      return { ...prev, [p.id]: next };
    });
  }

  async function addToCart() {
    setBusy(true);
    setError(null);
    try {
      const items = products
        .filter((p) => (qty[p.id] ?? 0) > 0)
        .map((p) => ({
          productId: p.id,
          nightDate: date,
          quantity: qty[p.id],
        }));
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Couldn't add to cart");
      }
      router.push("/cart");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add to cart");
    } finally {
      setBusy(false);
    }
  }

  if (products.length === 0) {
    return (
      <p className="text-sm text-moon-dim">
        No entry passes on sale for this night.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {products.map((p) => {
        const l = live[p.id];
        const available = l?.available ?? p.available;
        const soldOut = available <= 0;
        return (
          <div
            key={p.id}
            className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-b-0 last:pb-0"
          >
            <div>
              <p className="text-sm font-medium">{p.name}</p>
              {p.description && (
                <p className="text-xs text-moon-dim">{p.description}</p>
              )}
              <PriceTag
                paise={l?.price ?? p.price}
                updatedAt={l?.priceUpdatedAt ?? p.priceUpdatedAt}
                size="sm"
              />
              {soldOut ? (
                <Badge variant="danger" className="mt-1">Sold out tonight</Badge>
              ) : (
                available <= 10 && (
                  <Badge variant="rise" className="mt-1">
                    Only {available} left
                  </Badge>
                )
              )}
            </div>
            <div
              className="flex items-center gap-2"
              role="group"
              aria-label={`Quantity for ${p.name}`}
            >
              <Button
                variant="secondary"
                size="sm"
                aria-label={`Remove one ${p.name}`}
                disabled={(qty[p.id] ?? 0) === 0}
                onClick={() => step(p, -1)}
              >
                −
              </Button>
              <span className="tnum w-5 text-center text-sm">{qty[p.id] ?? 0}</span>
              <Button
                variant="secondary"
                size="sm"
                aria-label={`Add one ${p.name}`}
                disabled={soldOut || (qty[p.id] ?? 0) >= Math.min(p.maxPerOrder, available)}
                onClick={() => step(p, 1)}
              >
                +
              </Button>
            </div>
          </div>
        );
      })}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <Button
        className="w-full"
        size="lg"
        disabled={!anySelected || busy}
        onClick={addToCart}
      >
        {busy
          ? "Adding…"
          : anySelected
            ? `Add to cart · ${formatPaise(totalPaise)}`
            : "Add to cart"}
      </Button>
      <p className="text-center text-xs text-moon-dim">
        Price locks for 10 minutes once you start checkout.
      </p>
    </div>
  );
}
