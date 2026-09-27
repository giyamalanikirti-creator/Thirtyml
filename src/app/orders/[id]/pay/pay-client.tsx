"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatPaise } from "@/lib/utils";

interface CreateResponse {
  gatewayOrderId: string;
  keyId: string | null;
  amount: number;
  provider: string;
  holdExpiresAt: string | null;
  mock?: { paymentId: string; signature: string };
  error?: string;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function useCountdown(expiresAt: string | null) {
  const [left, setLeft] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (!expiresAt) return;
    const tick = () =>
      setLeft(
        Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
      );
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);
  return left;
}

export function PayClient({
  orderId,
  total,
  holdExpiresAt,
  guest,
}: {
  orderId: string;
  total: number;
  holdExpiresAt: string | null;
  guest: { name: string; email: string; phone: string };
}) {
  const router = useRouter();
  const [gateway, setGateway] = React.useState<CreateResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const secondsLeft = useCountdown(gateway?.holdExpiresAt ?? holdExpiresAt);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const body: CreateResponse = await res.json();
      if (cancelled) return;
      if (!res.ok) setError(body.error ?? "Couldn't start payment");
      else setGateway(body);
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  async function confirm(paymentId: string, signature: string) {
    const res = await fetch("/api/payments/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderId,
        razorpay_order_id: gateway!.gatewayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      }),
    });
    if (res.ok) {
      router.push(`/orders/${orderId}`);
    } else {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Payment confirmation failed");
      router.push(`/orders/${orderId}/status`);
    }
  }

  async function payWithRazorpay() {
    if (!gateway?.keyId) return;
    setBusy(true);
    setError(null);
    try {
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Couldn't load Razorpay"));
          document.body.appendChild(script);
        });
      }
      const rzp = new window.Razorpay!({
        key: gateway.keyId,
        order_id: gateway.gatewayOrderId,
        amount: gateway.amount,
        currency: "INR",
        name: "ThirtyML",
        description: "Nightlife booking",
        prefill: {
          name: guest.name,
          email: guest.email,
          contact: guest.phone,
        },
        theme: { color: "#f7a521" },
        handler: (response: {
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          confirm(response.razorpay_payment_id, response.razorpay_signature);
        },
        modal: {
          ondismiss: () => setBusy(false),
        },
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed to start");
      setBusy(false);
    }
  }

  async function payMock() {
    if (!gateway?.mock) return;
    setBusy(true);
    setError(null);
    await confirm(gateway.mock.paymentId, gateway.mock.signature);
    setBusy(false);
  }

  const expired = secondsLeft === 0;

  return (
    <div className="mx-auto max-w-md rounded-md border border-line bg-moon p-6 text-night">
      <h1 className="font-display text-xl font-semibold">Pay {formatPaise(total)}</h1>

      {secondsLeft !== null && !expired && (
        <p className="tnum mt-2 text-sm">
          ⏱ Price locked for{" "}
          <strong>
            {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
          </strong>
        </p>
      )}

      {expired ? (
        <>
          <p className="mt-4 text-sm">
            Your 10-minute price lock expired and the held spots were
            released. Start again from your cart — prices may have moved.
          </p>
          <Button className="mt-4 w-full" onClick={() => router.push("/cart")}>
            Back to cart
          </Button>
        </>
      ) : !gateway && !error ? (
        <p className="mt-4 text-sm text-night/60">Preparing secure payment…</p>
      ) : error ? (
        <>
          <p role="alert" className="mt-4 text-sm font-medium text-danger">
            {error}
          </p>
          <Button
            className="mt-4 w-full"
            variant="secondary"
            onClick={() => location.reload()}
          >
            Try again
          </Button>
        </>
      ) : gateway?.provider === "razorpay" ? (
        <>
          <p className="mt-3 text-sm text-night/70">
            UPI, cards, netbanking and wallets via Razorpay&apos;s secure checkout.
          </p>
          <Button
            className="mt-4 w-full"
            size="lg"
            disabled={busy}
            onClick={payWithRazorpay}
          >
            {busy ? "Opening Razorpay…" : `Pay ${formatPaise(total)}`}
          </Button>
        </>
      ) : (
        <>
          <p className="mt-3 rounded-sm border border-dusk/40 bg-dusk/10 p-3 text-xs text-night/70">
            Test mode: no payment gateway keys are configured, so this
            simulates a successful payment end to end.
          </p>
          <Button
            className="mt-4 w-full"
            size="lg"
            disabled={busy}
            onClick={payMock}
          >
            {busy ? "Confirming…" : `Simulate payment of ${formatPaise(total)}`}
          </Button>
        </>
      )}
    </div>
  );
}
