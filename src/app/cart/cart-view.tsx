"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CartView } from "@/lib/cart";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPaise } from "@/lib/utils";
import { acknowledgeChanges, changeQuantity, saveForLater } from "./actions";

const nightFmt = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Asia/Kolkata",
});

export function CartViewClient({ view }: { view: CartView }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const saved = view.lines.filter((l) => l.savedForLater);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (view.lines.length === 0) {
    return (
      <div className="mt-10 rounded-md border border-line bg-night-raised p-10 text-center">
        <p className="font-display text-lg font-semibold">Your cart is empty</p>
        <p className="mt-1 text-sm text-moon-dim">
          Prices are live — when you see one you like, grab it.
        </p>
        <Link
          href="/clubs"
          className={buttonVariants({ variant: "primary" }) + " mt-5"}
        >
          Explore clubs
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {view.notices.map((n) => (
          <p
            key={n}
            className="rounded-md border border-dusk/40 bg-dusk/10 px-4 py-2 text-sm text-dusk"
          >
            {n}
          </p>
        ))}

        {view.groups.map((group) => (
          <section
            key={group.key}
            className="rounded-md border border-line bg-night-raised"
          >
            <header className="border-b border-line px-4 py-3">
              <h2 className="font-display font-semibold">
                {group.clubName}
                <span className="ml-2 text-sm font-normal text-moon-dim">
                  {nightFmt.format(new Date(`${group.nightDate}T12:00:00`))}
                </span>
              </h2>
            </header>
            <ul>
              {group.lines.map((line) => (
                <li
                  key={line.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{line.productName}</p>
                    <p className="tnum text-sm text-moon-dim">
                      {formatPaise(line.currentPrice)} each
                    </p>
                    {line.priceChanged && !line.acknowledged && (
                      <Badge variant="rise" className="mt-1">
                        Price changed: {formatPaise(line.priceWhenAdded)} →{" "}
                        {formatPaise(line.currentPrice)}
                      </Badge>
                    )}
                    {line.available < line.quantity && (
                      <Badge variant="danger" className="mt-1">
                        Only {line.available} left for this night
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center gap-2"
                      role="group"
                      aria-label={`Quantity for ${line.productName}`}
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={busy}
                        aria-label="Reduce quantity"
                        onClick={() =>
                          run(() => changeQuantity(line.id, line.quantity - 1))
                        }
                      >
                        −
                      </Button>
                      <span className="tnum w-5 text-center text-sm">
                        {line.quantity}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={
                          busy ||
                          line.quantity >=
                            Math.min(line.maxPerOrder, line.available)
                        }
                        aria-label="Increase quantity"
                        onClick={() =>
                          run(() => changeQuantity(line.id, line.quantity + 1))
                        }
                      >
                        +
                      </Button>
                    </div>
                    <span className="tnum w-20 text-right font-display font-semibold">
                      {formatPaise(line.currentPrice * line.quantity)}
                    </span>
                    <div className="flex flex-col items-end gap-1 text-xs">
                      <button
                        className="text-moon-dim hover:text-moon"
                        disabled={busy}
                        onClick={() => run(() => saveForLater(line.id))}
                      >
                        Save for later
                      </button>
                      <button
                        className="text-danger/80 hover:text-danger"
                        disabled={busy}
                        onClick={() => run(() => changeQuantity(line.id, 0))}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {saved.length > 0 && (
          <section className="rounded-md border border-line">
            <header className="border-b border-line px-4 py-3">
              <h2 className="text-sm font-medium text-moon-dim">
                Saved for later
              </h2>
            </header>
            <ul>
              {saved.map((line) => (
                <li
                  key={line.id}
                  className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0"
                >
                  <div>
                    <p className="text-sm">{line.productName}</p>
                    <p className="text-xs text-moon-dim">
                      {line.clubName} ·{" "}
                      {nightFmt.format(new Date(`${line.nightDate}T12:00:00`))}
                    </p>
                  </div>
                  <button
                    className="text-xs text-dusk hover:underline"
                    disabled={busy}
                    onClick={() => run(() => saveForLater(line.id))}
                  >
                    Move to cart
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <aside>
        <div className="sticky top-20 rounded-md border border-line bg-night-raised p-5">
          <h2 className="font-display font-semibold">Estimated total</h2>
          <p className="tnum mt-2 font-display text-2xl font-bold">
            {formatPaise(view.subtotal)}
          </p>
          <p className="mt-1 text-xs text-moon-dim">
            Convenience fee and GST are itemised at checkout — no surprises.
          </p>

          {view.needsAcknowledgement ? (
            <>
              <p className="mt-4 rounded-sm border border-rise/40 bg-rise/10 p-3 text-xs text-rise">
                Some prices changed while these items sat in your cart. Confirm
                the new prices to continue.
              </p>
              <Button
                className="mt-3 w-full"
                variant="secondary"
                disabled={busy}
                onClick={() => run(() => acknowledgeChanges())}
              >
                Okay, use the new prices
              </Button>
            </>
          ) : (
            <Link
              href="/checkout"
              className={buttonVariants({ size: "lg" }) + " mt-4 w-full"}
            >
              Proceed to checkout
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
