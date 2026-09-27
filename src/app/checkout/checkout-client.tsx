"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { CartView } from "@/lib/cart";
import type { Totals } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPaise } from "@/lib/utils";
import { checkCoupon, submitCheckout } from "./actions";

const nightFmt = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Asia/Kolkata",
});

export function CheckoutClient({
  view,
  initialTotals,
  walletBalance,
  profile,
}: {
  view: CartView;
  initialTotals: Totals;
  walletBalance: number;
  profile: { name: string; phone: string; email: string };
}) {
  const router = useRouter();
  const [name, setName] = React.useState(profile.name);
  const [phone, setPhone] = React.useState(profile.phone);
  const [email, setEmail] = React.useState(profile.email);
  const [couponInput, setCouponInput] = React.useState("");
  const [appliedCoupon, setAppliedCoupon] = React.useState<string | null>(null);
  const [useWallet, setUseWallet] = React.useState(false);
  const [agreed, setAgreed] = React.useState(false);
  const [totals, setTotals] = React.useState(initialTotals);
  const [couponMessage, setCouponMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<"coupon" | "pay" | null>(null);

  async function refreshTotals(code: string | null, wallet: boolean) {
    const result = await checkCoupon(code ?? "", wallet);
    setTotals(result.totals);
    return result;
  }

  async function applyCoupon() {
    setBusy("coupon");
    setCouponMessage(null);
    try {
      const result = await refreshTotals(couponInput, useWallet);
      if (result.couponError) {
        setAppliedCoupon(null);
        setCouponMessage(result.couponError);
      } else if (couponInput) {
        setAppliedCoupon(couponInput);
        setCouponMessage(`Applied — you save ${formatPaise(result.totals.discount)}`);
      }
    } finally {
      setBusy(null);
    }
  }

  async function toggleWallet(next: boolean) {
    setUseWallet(next);
    await refreshTotals(appliedCoupon, next);
  }

  async function pay() {
    setBusy("pay");
    setError(null);
    try {
      const result = await submitCheckout({
        name,
        phone,
        email,
        couponCode: appliedCoupon ?? undefined,
        useWallet,
        agreed,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/orders/${result.orderId}/pay`);
    } finally {
      setBusy(null);
    }
  }

  const active = view.lines.filter((l) => !l.savedForLater);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <section>
          <h2 className="font-display text-lg font-semibold">1 · Review</h2>
          <ul className="mt-3 divide-y divide-line rounded-md border border-line">
            {active.map((line) => (
              <li
                key={line.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span>
                  {line.productName} ×{line.quantity}
                  <span className="ml-2 text-moon-dim">
                    {line.clubName} ·{" "}
                    {nightFmt.format(new Date(`${line.nightDate}T12:00:00`))}
                  </span>
                </span>
                <span className="tnum font-medium">
                  {formatPaise(line.currentPrice * line.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold">
            2 · Lead guest
          </h2>
          <p className="mt-1 text-xs text-moon-dim">
            The QR ticket and receipts go to these details. ID is checked at
            the door.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="mb-1 block text-moon-dim">Full name</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-moon-dim">Phone</span>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" autoComplete="tel" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-moon-dim">Email</span>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" />
            </label>
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold">3 · Offers</h2>
          <div className="mt-3 flex max-w-sm gap-2">
            <Input
              placeholder="Coupon code"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              aria-label="Coupon code"
            />
            <Button
              variant="secondary"
              disabled={busy !== null || !couponInput}
              onClick={applyCoupon}
            >
              {busy === "coupon" ? "Checking…" : "Apply"}
            </Button>
          </div>
          {couponMessage && (
            <p
              className={
                "mt-2 text-sm " +
                (totals.discount > 0 ? "text-drop" : "text-danger")
              }
            >
              {couponMessage}
            </p>
          )}
          {walletBalance > 0 && (
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useWallet}
                onChange={(e) => toggleWallet(e.target.checked)}
              />
              Use wallet credit ({formatPaise(walletBalance)} available)
            </label>
          )}
        </section>
      </div>

      <aside>
        <div className="sticky top-20 rounded-md border border-line bg-moon p-5 text-night">
          <h2 className="font-display font-semibold">Price breakdown</h2>
          <dl className="tnum mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatPaise(totals.subtotal)}</dd>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <dt>Discount</dt>
                <dd>−{formatPaise(totals.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Convenience fee</dt>
              <dd>{formatPaise(totals.convenienceFee)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>GST on fee</dt>
              <dd>{formatPaise(totals.tax)}</dd>
            </div>
            {totals.walletUsed > 0 && (
              <div className="flex justify-between text-emerald-700">
                <dt>Wallet credit</dt>
                <dd>−{formatPaise(totals.walletUsed)}</dd>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-night/20 pt-2 font-display text-base font-bold">
              <dt>Total</dt>
              <dd>{formatPaise(totals.total)}</dd>
            </div>
          </dl>

          <label className="mt-4 flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I agree to the{" "}
              <a href="/legal/terms" target="_blank" className="underline">
                terms
              </a>{" "}
              and{" "}
              <a href="/legal/refunds" target="_blank" className="underline">
                refund policy
              </a>
              .
            </span>
          </label>

          {error && (
            <p role="alert" className="mt-3 text-sm font-medium text-danger">
              {error}
            </p>
          )}

          <Button
            className="mt-4 w-full"
            size="lg"
            disabled={busy !== null || !agreed}
            onClick={pay}
          >
            {busy === "pay" ? "Locking your price…" : `Pay ${formatPaise(totals.total)}`}
          </Button>
          <p className="mt-2 text-center text-xs text-night/60">
            Your price locks for 10 minutes once you continue.
          </p>
        </div>
      </aside>
    </div>
  );
}
