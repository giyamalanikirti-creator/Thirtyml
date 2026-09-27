"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";

/**
 * Polls while the payment is pending so a customer who closed the tab
 * mid-payment still lands on the right outcome (webhook/reconciliation
 * resolve the order server-side).
 */
export function StatusClient({
  orderId,
  initialStatus,
}: {
  orderId: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = React.useState(initialStatus);

  React.useEffect(() => {
    if (status !== "pending_payment") return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) return;
      const body = await res.json();
      setStatus(body.status);
      if (body.status === "paid") {
        clearInterval(interval);
        router.push(`/orders/${orderId}`);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [status, orderId, router]);

  if (status === "pending_payment") {
    return (
      <div className="text-center">
        <p className="font-display text-xl font-semibold">
          Waiting for your payment…
        </p>
        <p className="mt-2 text-sm text-moon-dim">
          If you completed payment, this page updates automatically — banks
          sometimes take a minute to confirm. It&apos;s safe to keep this tab open.
        </p>
        <Link
          href={`/orders/${orderId}/pay`}
          className={buttonVariants({ variant: "secondary" }) + " mt-6"}
        >
          Reopen payment
        </Link>
      </div>
    );
  }

  if (status === "paid") {
    return (
      <div className="text-center">
        <p className="font-display text-xl font-semibold text-drop">Paid ✓</p>
        <Link
          href={`/orders/${orderId}`}
          className={buttonVariants({}) + " mt-6"}
        >
          See your tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="font-display text-xl font-semibold">
        {status === "expired"
          ? "This order expired"
          : status === "failed"
            ? "Payment failed"
            : `Order ${status}`}
      </p>
      <p className="mt-2 text-sm text-moon-dim">
        {status === "expired"
          ? "The 10-minute price lock ran out and the held spots were released."
          : "No money left your account, or it will be auto-refunded by your bank."}
      </p>
      <Link href="/cart" className={buttonVariants({}) + " mt-6"}>
        Back to cart
      </Link>
    </div>
  );
}
